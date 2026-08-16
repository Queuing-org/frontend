import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { joinRoom } from "@/src/features/room/api/joinRoom";
import { publishLeaveRequest } from "@/src/features/room/api/websocket/publishLeaveRequest";
import { subscribeRoomEvents } from "@/src/features/room/api/websocket/subscribeRoomEvents";
import {
  acquireSocketSession,
  addSocketListener,
  getSocketClient,
  stopSocketAutoReconnect,
} from "@/src/shared/api/websocket/stompConnection";
import { useRoomRealtimeEvents } from "./useRoomRealtimeEvents";
import { fetchRoomMeta } from "@/src/features/room/api/fetchRoomMeta";
import { roomKeys } from "@/src/features/room/model/queryKeys";
import { playlistKeys } from "@/src/features/playlist/model/queryKeys";
import { ApiError } from "@/src/shared/api/api-error";
import { userKeys } from "@/src/features/user/model/queryKeys";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));
vi.mock("@/src/features/room/api/fetchRoomMeta", () => ({ fetchRoomMeta: vi.fn() }));
vi.mock("@/src/features/room/api/websocket/subscribeRoomEvents", () => ({
  subscribeRoomEvents: vi.fn(),
}));
vi.mock("@/src/features/room/api/joinRoom", () => ({
  joinRoom: vi.fn(),
}));
vi.mock(
  "@/src/features/room/api/websocket/publishLeaveRequest",
  () => ({
    publishLeaveRequest: vi.fn(),
  }),
);
vi.mock("@/src/shared/api/websocket/stompConnection", () => ({
  acquireSocketSession: vi.fn(),
  addSocketListener: vi.fn(),
  getSocketClient: vi.fn(),
  stopSocketAutoReconnect: vi.fn(),
}));

describe("useRoomRealtimeEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(acquireSocketSession).mockReturnValue(vi.fn());
    vi.mocked(getSocketClient).mockReturnValue({
      subscribe: vi.fn(() => ({ id: "user-events", unsubscribe: vi.fn() })),
    } as never);
    sessionStorage.clear();
  });

  it("ROOM_INFO_UPDATED는 trackLimitMinutes를 검증하고 REST 메타의 썸네일로 동기화한다", async () => {
    const queryClient = new QueryClient();
    const authoritativeMeta = {
      title: "새 제목", slug: "room", thumbnailUrl: "https://img/new.jpg",
      hasPassword: false, maxParticipants: null, trackLimitMinutes: 30, tags: [], owner: null,
    };
    vi.mocked(fetchRoomMeta).mockResolvedValue(authoritativeMeta as never);
    let handler: Parameters<typeof subscribeRoomEvents>[1] | undefined;
    vi.mocked(subscribeRoomEvents).mockImplementation((_slug, next) => {
      handler = next;
      return { id: "room", unsubscribe: vi.fn() };
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useRoomRealtimeEvents({
      cleanupChatSubscriptions: vi.fn(), initializeChatStateFromJoinData: vi.fn(),
      resetChatState: vi.fn(), setJoinErrorMessage: vi.fn(),
      setLivePlaybackStatus: vi.fn(), setStatus: vi.fn(), slug: "room",
    }), { wrapper });
    act(() => result.current.ensureRoomSubscription("room"));
    act(() => handler?.({ body: JSON.stringify({
      type: "ROOM_INFO_UPDATED", roomSlug: "room", timestamp: 1,
      data: { title: "새 제목", hasPassword: false, maxParticipants: null, trackLimitMinutes: 30, tags: [] },
    }) } as never));
    await waitFor(() => expect(queryClient.getQueryData(roomKeys.meta("room"))).toEqual(authoritativeMeta));
    expect(fetchRoomMeta).toHaveBeenCalledWith("room", expect.any(AbortSignal));
  });

  it("ROOM_DELETED는 진행 중인 메타 재조회를 폐기하고 방 상태·비밀번호를 정리한다", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(playlistKeys.roomPlayback("room"), { value: true });
    queryClient.setQueryData(playlistKeys.roomParticipants("room"), { value: true });
    queryClient.setQueryData(playlistKeys.roomQueue("room"), { value: true });
    queryClient.setQueryData(roomKeys.meta("room"), { value: true });
    sessionStorage.setItem("room-password:room", "secret");
    let resolveMeta!: (value: never) => void;
    vi.mocked(fetchRoomMeta).mockReturnValue(new Promise((resolve) => {
      resolveMeta = resolve;
    }));
    let handler: Parameters<typeof subscribeRoomEvents>[1] | undefined;
    const unsubscribe = vi.fn();
    vi.mocked(subscribeRoomEvents).mockImplementation((_slug, next) => {
      handler = next;
      return { id: "room", unsubscribe: vi.fn(unsubscribe) } as never;
    });
    const cleanupChatSubscriptions = vi.fn();
    const resetChatState = vi.fn();
    const setLivePlaybackStatus = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useRoomRealtimeEvents({
      cleanupChatSubscriptions, initializeChatStateFromJoinData: vi.fn(), resetChatState,
      setJoinErrorMessage: vi.fn(), setLivePlaybackStatus, setStatus: vi.fn(), slug: "room",
    }), { wrapper });
    act(() => result.current.ensureRoomSubscription("room", "secret"));
    act(() => handler?.({ body: JSON.stringify({
      type: "ROOM_INFO_UPDATED", roomSlug: "room", timestamp: 1,
      data: { title: "갱신 중", hasPassword: true, maxParticipants: null, trackLimitMinutes: null, tags: [] },
    }) } as never));
    const metaSignal = vi.mocked(fetchRoomMeta).mock.calls[0]?.[1];
    act(() => handler?.({ body: JSON.stringify({
      type: "ROOM_DELETED", roomSlug: "room", timestamp: 2, data: {},
    }) } as never));
    expect(cleanupChatSubscriptions).toHaveBeenCalledOnce();
    expect(resetChatState).toHaveBeenCalledOnce();
    expect(setLivePlaybackStatus).toHaveBeenCalledWith(null);
    expect(sessionStorage.getItem("room-password:room")).toBeNull();
    expect(queryClient.getQueryData(playlistKeys.roomPlayback("room"))).toBeUndefined();
    expect(queryClient.getQueryData(roomKeys.meta("room"))).toBeUndefined();
    expect(metaSignal?.aborted).toBe(true);
    await act(async () => {
      resolveMeta({ title: "늦은 응답" } as never);
      await Promise.resolve();
    });
    expect(queryClient.getQueryData(roomKeys.meta("room"))).toBeUndefined();
    expect(navigation.replace).toHaveBeenCalledWith("/");
    expect(publishLeaveRequest).not.toHaveBeenCalled();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("같은 방 session-replaced를 받으면 방 연결만 정리하고 재접속을 중단한다", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(playlistKeys.roomPlayback("room"), { value: true });
    queryClient.setQueryData(playlistKeys.roomParticipants("room"), { value: true });
    queryClient.setQueryData(playlistKeys.roomQueue("room"), { value: true });
    queryClient.setQueryData(roomKeys.meta("room"), { value: true });
    let userEventHandler: ((message: { body: string }) => void) | undefined;
    const userSubscription = { id: "user-events", unsubscribe: vi.fn() };
    vi.mocked(getSocketClient).mockReturnValue({
      subscribe: vi.fn((_destination, handler) => {
        userEventHandler = handler as typeof userEventHandler;
        return userSubscription;
      }),
    } as never);
    vi.mocked(addSocketListener).mockReturnValue(vi.fn());
    const roomSubscription = { id: "room-events", unsubscribe: vi.fn() };
    vi.mocked(subscribeRoomEvents).mockReturnValue(roomSubscription);
    const setJoinErrorMessage = vi.fn();
    const setStatus = vi.fn();
    const resetChatState = vi.fn();
    const cleanupChatSubscriptions = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () =>
        useRoomRealtimeEvents({
          cleanupChatSubscriptions,
          initializeChatStateFromJoinData: vi.fn(),
          resetChatState,
          setJoinErrorMessage,
          setLivePlaybackStatus: vi.fn(),
          setStatus,
          slug: "room",
        }),
      { wrapper },
    );

    act(() => result.current.ensureRoomSubscription("room", null));
    act(() => {
      userEventHandler?.({
        body: JSON.stringify({
          type: "ERROR",
          roomSlug: "other-room",
          timestamp: 1,
          data: {
            code: "user.session-replaced",
            message: "server message",
          },
        }),
      });
    });
    expect(stopSocketAutoReconnect).not.toHaveBeenCalled();
    expect(roomSubscription.unsubscribe).not.toHaveBeenCalled();

    act(() => {
      userEventHandler?.({
        body: JSON.stringify({
          type: "ERROR",
          roomSlug: "room",
          timestamp: 1,
          data: {
            code: "user.session-replaced",
            message: "server message",
          },
        }),
      });
    });

    expect(roomSubscription.unsubscribe).toHaveBeenCalledTimes(1);
    expect(userSubscription.unsubscribe).toHaveBeenCalledTimes(1);
    expect(cleanupChatSubscriptions).toHaveBeenCalledTimes(1);
    expect(resetChatState).toHaveBeenCalledTimes(1);
    expect(setStatus).toHaveBeenCalledWith("error");
    expect(setJoinErrorMessage).toHaveBeenCalledWith(
      "현재 방은 다른 창에서 마지막으로 열렸습니다.",
    );
    expect(stopSocketAutoReconnect).toHaveBeenCalledTimes(1);
    expect(publishLeaveRequest).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(playlistKeys.roomPlayback("room"))).toBeUndefined();
    expect(queryClient.getQueryData(playlistKeys.roomParticipants("room"))).toBeUndefined();
    expect(queryClient.getQueryData(playlistKeys.roomQueue("room"))).toBeUndefined();
    expect(queryClient.getQueryData(roomKeys.meta("room"))).toBeUndefined();
  });

  it("STOMP ERROR frame의 session-replaced도 동일한 terminal room cleanup을 수행한다", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(playlistKeys.roomPlayback("room"), { value: true });
    queryClient.setQueryData(playlistKeys.roomParticipants("room"), { value: true });
    queryClient.setQueryData(playlistKeys.roomQueue("room"), { value: true });
    queryClient.setQueryData(roomKeys.meta("room"), { value: true });
    let socketListener: Parameters<typeof addSocketListener>[0] | undefined;
    vi.mocked(addSocketListener).mockImplementation((listener) => {
      socketListener = listener;
      return vi.fn();
    });
    const roomSubscription = { id: "room-events", unsubscribe: vi.fn() };
    const userSubscription = { id: "user-events", unsubscribe: vi.fn() };
    vi.mocked(subscribeRoomEvents).mockReturnValue(roomSubscription);
    vi.mocked(getSocketClient).mockReturnValue({
      subscribe: vi.fn(() => userSubscription),
    } as never);
    const cleanupChatSubscriptions = vi.fn();
    const resetChatState = vi.fn();
    const setJoinErrorMessage = vi.fn();
    const setStatus = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () =>
        useRoomRealtimeEvents({
          cleanupChatSubscriptions,
          initializeChatStateFromJoinData: vi.fn(),
          resetChatState,
          setJoinErrorMessage,
          setLivePlaybackStatus: vi.fn(),
          setStatus,
          slug: "room",
        }),
      { wrapper },
    );

    act(() => result.current.ensureRoomSubscription("room"));
    act(() => {
      socketListener?.onStompError?.({
        body: JSON.stringify({
          statusCode: 409,
          code: "user.session-replaced",
          message: "replaced",
        }),
      } as never);
    });

    expect(roomSubscription.unsubscribe).toHaveBeenCalledOnce();
    expect(userSubscription.unsubscribe).toHaveBeenCalledOnce();
    expect(cleanupChatSubscriptions).toHaveBeenCalledOnce();
    expect(resetChatState).toHaveBeenCalledOnce();
    expect(setStatus).toHaveBeenCalledWith("error");
    expect(setJoinErrorMessage).toHaveBeenCalledWith(
      "현재 방은 다른 창에서 마지막으로 열렸습니다.",
    );
    expect(stopSocketAutoReconnect).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(playlistKeys.roomPlayback("room"))).toBeUndefined();
    expect(queryClient.getQueryData(playlistKeys.roomParticipants("room"))).toBeUndefined();
    expect(queryClient.getQueryData(playlistKeys.roomQueue("room"))).toBeUndefined();
    expect(queryClient.getQueryData(roomKeys.meta("room"))).toBeUndefined();
    expect(publishLeaveRequest).not.toHaveBeenCalled();
  });

  it("곡 시작 cache update는 즉시 적용하고 관련 invalidation만 합친다", async () => {
    vi.useFakeTimers();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const setQueriesData = vi.spyOn(queryClient, "setQueriesData");
    let roomEventHandler:
      | Parameters<typeof subscribeRoomEvents>[1]
      | undefined;
    const roomSubscription = { id: "room-events", unsubscribe: vi.fn() };
    vi.mocked(subscribeRoomEvents).mockImplementation((_slug, handler) => {
      roomEventHandler = handler;
      return roomSubscription;
    });
    vi.mocked(addSocketListener).mockReturnValue(vi.fn());

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result, unmount } = renderHook(
      () =>
        useRoomRealtimeEvents({
          cleanupChatSubscriptions: vi.fn(),
          initializeChatStateFromJoinData: vi.fn(),
          resetChatState: vi.fn(),
          setJoinErrorMessage: vi.fn(),
          setLivePlaybackStatus: vi.fn(),
          setStatus: vi.fn(),
          slug: "room",
        }),
      { wrapper },
    );

    act(() => result.current.ensureRoomSubscription("room", null));
    act(() => {
      roomEventHandler?.({
        body: JSON.stringify({
          type: "TRACK_STARTED",
          roomSlug: "room",
          timestamp: 1,
          data: {
            entryId: "entry-1",
            revision: 2,
            track: {
              title: "새 노래",
              videoId: "video-1",
              provider: "YOUTUBE",
              durationMs: 180_000,
              thumbnailUrl: "https://img.example.com/current.jpg",
            },
            addedBy: {
              nickname: "신청자",
              slug: "requester",
              avatarUrl: null,
            },
            playbackStatus: {
              videoId: "video-1",
              status: "PLAYING",
              currentTime: 0,
              serverTimestamp: 1,
            },
          },
        }),
      } as never);
    });

    expect(setQueriesData).toHaveBeenCalledTimes(1);
    expect(invalidateQueries).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(75);
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["roomMeta", "room"],
    });

    invalidateQueries.mockClear();
    act(() => {
      roomEventHandler?.({
        body: JSON.stringify({
          type: "TRACK_ENDED",
          roomSlug: "room",
          timestamp: 2,
          data: {},
        }),
      } as never);
    });

    expect(invalidateQueries).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(75);
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["roomMeta", "room"],
    });

    unmount();
  });

  it("음악력 변경 이벤트는 재생 건별 cache 점수만 갱신하고 myVote를 보존한다", () => {
    const queryClient = new QueryClient();
    const firstKey = userKeys.musicPower("target", "room", "entry-1");
    const secondKey = userKeys.musicPower("target", "room", "entry-2");
    queryClient.setQueryData(firstKey, {
      musicPower: 2,
      myVote: "UPVOTE",
      targetUserSlug: "target",
    });
    queryClient.setQueryData(secondKey, {
      musicPower: 2,
      myVote: null,
      targetUserSlug: "target",
    });
    let roomEventHandler:
      | Parameters<typeof subscribeRoomEvents>[1]
      | undefined;
    vi.mocked(subscribeRoomEvents).mockImplementation((_slug, handler) => {
      roomEventHandler = handler;
      return { id: "room-events", unsubscribe: vi.fn() };
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () =>
        useRoomRealtimeEvents({
          cleanupChatSubscriptions: vi.fn(),
          initializeChatStateFromJoinData: vi.fn(),
          resetChatState: vi.fn(),
          setJoinErrorMessage: vi.fn(),
          setLivePlaybackStatus: vi.fn(),
          setStatus: vi.fn(),
          slug: "room",
        }),
      { wrapper },
    );

    act(() => result.current.ensureRoomSubscription("room"));
    act(() => {
      roomEventHandler?.({
        body: JSON.stringify({
          type: "MUSIC_POWER_CHANGED",
          roomSlug: "room",
          timestamp: 1,
          data: {
            entryId: "entry-2",
            targetUserSlug: "target",
            musicPower: 3,
          },
        }),
      } as never);
    });

    expect(queryClient.getQueryData(firstKey)).toMatchObject({
      musicPower: 3,
      myVote: "UPVOTE",
    });
    expect(queryClient.getQueryData(secondKey)).toMatchObject({
      musicPower: 3,
      myVote: null,
    });
  });

  it("같은 room event 10회 burst를 query target별 1회로 제한한다", async () => {
    vi.useFakeTimers();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const cancelQueries = vi.spyOn(queryClient, "cancelQueries");
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    let roomEventHandler:
      | Parameters<typeof subscribeRoomEvents>[1]
      | undefined;
    vi.mocked(subscribeRoomEvents).mockImplementation((_slug, handler) => {
      roomEventHandler = handler;
      return { id: "room-events", unsubscribe: vi.fn() };
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result, unmount } = renderHook(
      () =>
        useRoomRealtimeEvents({
          cleanupChatSubscriptions: vi.fn(),
          initializeChatStateFromJoinData: vi.fn(),
          resetChatState: vi.fn(),
          setJoinErrorMessage: vi.fn(),
          setLivePlaybackStatus: vi.fn(),
          setStatus: vi.fn(),
          slug: "room",
        }),
      { wrapper },
    );

    act(() => result.current.ensureRoomSubscription("room", null));
    act(() => {
      for (let index = 0; index < 10; index += 1) {
        roomEventHandler?.({
          body: JSON.stringify({
            type: "QUEUE_ADDED",
            roomSlug: "room",
            timestamp: index,
            data: {},
          }),
        } as never);
      }
    });

    act(() => vi.advanceTimersByTime(74));
    expect(invalidateQueries).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(invalidateQueries).toHaveBeenCalledTimes(2);
    expect(cancelQueries).toHaveBeenCalledTimes(2);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["roomPlayback", "room"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["roomQueue", "room"],
    });

    invalidateQueries.mockClear();
    cancelQueries.mockClear();
    act(() => {
      for (let index = 0; index < 10; index += 1) {
        roomEventHandler?.({
          body: JSON.stringify({
            type: "ROOM_JOINED",
            roomSlug: "room",
            timestamp: index,
            data: {},
          }),
        } as never);
      }
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(75);
    });
    expect(invalidateQueries).toHaveBeenCalledTimes(2);
    expect(cancelQueries).toHaveBeenCalledTimes(2);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["roomParticipants", "room"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["roomMeta", "room"],
    });

    unmount();
  });

  it("slug 전환과 unmount에서 예약한 invalidation을 폐기한다", () => {
    vi.useFakeTimers();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const roomEventHandlers = new Map<
      string,
      Parameters<typeof subscribeRoomEvents>[1]
    >();
    vi.mocked(subscribeRoomEvents).mockImplementation((roomSlug, handler) => {
      roomEventHandlers.set(roomSlug, handler);
      return { id: roomSlug, unsubscribe: vi.fn() };
    });
    const cleanupChatSubscriptions = vi.fn();
    const initializeChatStateFromJoinData = vi.fn();
    const resetChatState = vi.fn();
    const setJoinErrorMessage = vi.fn();
    const setLivePlaybackStatus = vi.fn();
    const setStatus = vi.fn();

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result, rerender, unmount } = renderHook(
      ({ roomSlug }: { roomSlug: string }) =>
        useRoomRealtimeEvents({
          cleanupChatSubscriptions,
          initializeChatStateFromJoinData,
          resetChatState,
          setJoinErrorMessage,
          setLivePlaybackStatus,
          setStatus,
          slug: roomSlug,
        }),
      { initialProps: { roomSlug: "room" }, wrapper },
    );

    act(() => result.current.ensureRoomSubscription("room", null));
    act(() => {
      roomEventHandlers.get("room")?.({
        body: JSON.stringify({
          type: "QUEUE_ADDED",
          roomSlug: "room",
          timestamp: 1,
          data: {},
        }),
      } as never);
    });
    rerender({ roomSlug: "other-room" });
    act(() => vi.advanceTimersByTime(75));
    expect(invalidateQueries).not.toHaveBeenCalled();

    act(() => result.current.ensureRoomSubscription("other-room", null));
    act(() => {
      roomEventHandlers.get("other-room")?.({
        body: JSON.stringify({
          type: "ROOM_JOINED",
          roomSlug: "other-room",
          timestamp: 2,
          data: {},
        }),
      } as never);
    });
    unmount();
    act(() => vi.advanceTimersByTime(75));
    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it("연결 종료 후 join부터 복구하고 중복 없이 다시 구독한다", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const fetchReconnectedMeta = vi.fn().mockResolvedValue({
      activeUsersCount: 2,
      hasPassword: false,
      isPublic: true,
      slug: "room",
      tags: [],
      title: "복구된 방",
    });
    await queryClient.fetchQuery({
      queryKey: ["roomMeta", "room"],
      queryFn: fetchReconnectedMeta,
    });
    fetchReconnectedMeta.mockClear();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const removeSocketListener = vi.fn();
    const releaseSocketSession = vi.fn();
    vi.mocked(acquireSocketSession).mockReturnValue(releaseSocketSession);
    let socketListener:
      | Parameters<typeof addSocketListener>[0]
      | undefined;
    vi.mocked(addSocketListener).mockImplementation((listener) => {
      socketListener = listener;
      return removeSocketListener;
    });

    const subscriptions = Array.from({ length: 3 }, () => ({
      id: crypto.randomUUID(),
      unsubscribe: vi.fn(),
    }));
    vi.mocked(subscribeRoomEvents)
      .mockReturnValueOnce(subscriptions[0])
      .mockReturnValueOnce(subscriptions[1])
      .mockReturnValueOnce(subscriptions[2]);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const cleanupChatSubscriptions = vi.fn();
    const initializeChatStateFromJoinData = vi.fn();
    const resetChatState = vi.fn();
    const setJoinErrorMessage = vi.fn();
    const setLivePlaybackStatus = vi.fn();
    const setStatus = vi.fn();
    vi.mocked(joinRoom).mockResolvedValue({
      roomSlug: "room",
      timestamp: 1,
      data: null,
    });

    const { result, unmount } = renderHook(
      () =>
        useRoomRealtimeEvents({
          cleanupChatSubscriptions,
          initializeChatStateFromJoinData,
          resetChatState,
          setJoinErrorMessage,
          setLivePlaybackStatus,
          setStatus,
          slug: "room",
        }),
      { wrapper },
    );

    await waitFor(() => expect(socketListener).toBeDefined());

    act(() => {
      result.current.ensureRoomSubscription("room", "secret");
    });
    expect(subscribeRoomEvents).toHaveBeenCalledTimes(1);

    act(() => {
      socketListener?.onWebSocketClose?.({} as CloseEvent);
    });
    expect(subscriptions[0].unsubscribe).toHaveBeenCalledTimes(1);
    expect(cleanupChatSubscriptions).toHaveBeenCalledTimes(1);
    expect(setStatus).toHaveBeenCalledWith("joining");

    act(() => {
      socketListener?.onConnect?.({} as never);
    });
    await waitFor(() =>
      expect(joinRoom).toHaveBeenCalledWith(
        "room",
        { password: "secret" },
        {
          leaveOnAbort: false,
          signal: expect.any(AbortSignal),
        },
      ),
    );
    await waitFor(() =>
      expect(subscribeRoomEvents).toHaveBeenCalledTimes(2),
    );
    expect(initializeChatStateFromJoinData).toHaveBeenCalledWith(null);
    expect(setStatus).toHaveBeenCalledWith("joined");

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["roomPlayback", "room"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["roomParticipants", "room"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["roomQueue", "room"],
    });
    await waitFor(() => expect(fetchReconnectedMeta).toHaveBeenCalledOnce());

    act(() => {
      socketListener?.onConnect?.({} as never);
    });
    expect(joinRoom).toHaveBeenCalledTimes(1);
    expect(subscribeRoomEvents).toHaveBeenCalledTimes(2);

    act(() => {
      socketListener?.onWebSocketClose?.({} as CloseEvent);
      socketListener?.onConnect?.({} as never);
    });
    await waitFor(() => expect(joinRoom).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(subscribeRoomEvents).toHaveBeenCalledTimes(3),
    );
    expect(subscriptions[1].unsubscribe).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.leaveRoomSession();
    });
    expect(subscriptions[2].unsubscribe).toHaveBeenCalledTimes(1);
    expect(publishLeaveRequest).toHaveBeenCalledWith("room");
    expect(publishLeaveRequest).toHaveBeenCalledTimes(1);

    unmount();
    expect(removeSocketListener).toHaveBeenCalledTimes(1);
    expect(acquireSocketSession).toHaveBeenCalledTimes(1);
    expect(releaseSocketSession).toHaveBeenCalledTimes(1);
  });

  it("재입장 진행 중 방을 나가면 요청을 취소하고 leave를 한 번만 보낸다", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    let socketListener:
      | Parameters<typeof addSocketListener>[0]
      | undefined;
    vi.mocked(addSocketListener).mockImplementation((listener) => {
      socketListener = listener;
      return vi.fn();
    });
    vi.mocked(subscribeRoomEvents).mockReturnValue({
      id: "subscription",
      unsubscribe: vi.fn(),
    });
    vi.mocked(joinRoom).mockReturnValue(new Promise<never>(() => {}));

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result, unmount } = renderHook(
      () =>
        useRoomRealtimeEvents({
          cleanupChatSubscriptions: vi.fn(),
          initializeChatStateFromJoinData: vi.fn(),
          resetChatState: vi.fn(),
          setJoinErrorMessage: vi.fn(),
          setLivePlaybackStatus: vi.fn(),
          setStatus: vi.fn(),
          slug: "room",
        }),
      { wrapper },
    );

    await waitFor(() => expect(socketListener).toBeDefined());
    act(() => {
      result.current.ensureRoomSubscription("room", "secret");
      socketListener?.onWebSocketClose?.({} as CloseEvent);
      socketListener?.onConnect?.({} as never);
    });
    await waitFor(() => expect(joinRoom).toHaveBeenCalledTimes(1));

    const rejoinOptions = vi.mocked(joinRoom).mock.calls[0]?.[2];
    expect(rejoinOptions?.signal.aborted).toBe(false);

    act(() => {
      result.current.leaveRoomSession();
    });

    expect(rejoinOptions?.signal.aborted).toBe(true);
    expect(publishLeaveRequest).toHaveBeenCalledWith("room");
    expect(publishLeaveRequest).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("재접속 join이 room.not-found면 삭제 종료 흐름으로 홈 이동한다", async () => {
    const queryClient = new QueryClient();
    let socketListener: Parameters<typeof addSocketListener>[0] | undefined;
    vi.mocked(addSocketListener).mockImplementation((listener) => {
      socketListener = listener;
      return vi.fn();
    });
    vi.mocked(subscribeRoomEvents).mockReturnValue({ id: "room", unsubscribe: vi.fn() });
    vi.mocked(joinRoom).mockRejectedValue(new ApiError({
      status: 404, code: "room.not-found", message: "없는 방",
    }));
    const cleanupChatSubscriptions = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useRoomRealtimeEvents({
      cleanupChatSubscriptions, initializeChatStateFromJoinData: vi.fn(),
      resetChatState: vi.fn(), setJoinErrorMessage: vi.fn(),
      setLivePlaybackStatus: vi.fn(), setStatus: vi.fn(), slug: "room",
    }), { wrapper });
    await waitFor(() => expect(socketListener).toBeDefined());
    act(() => {
      result.current.ensureRoomSubscription("room");
      socketListener?.onWebSocketClose?.({} as CloseEvent);
      socketListener?.onConnect?.({} as never);
    });
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith("/"));
    expect(cleanupChatSubscriptions).toHaveBeenCalled();
    expect(publishLeaveRequest).not.toHaveBeenCalled();
  });
});
