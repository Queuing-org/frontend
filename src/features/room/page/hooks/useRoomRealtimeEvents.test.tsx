import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { joinRoom } from "@/src/features/room/api/joinRoom";
import { publishLeaveRequest } from "@/src/features/room/api/websocket/publishLeaveRequest";
import { subscribeRoomEvents } from "@/src/features/room/api/websocket/subscribeRoomEvents";
import { addSocketListener } from "@/src/shared/api/websocket/stompConnection";
import { useRoomRealtimeEvents } from "./useRoomRealtimeEvents";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));
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
  addSocketListener: vi.fn(),
}));

describe("useRoomRealtimeEvents 재연결", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("연결 종료 후 join부터 복구하고 중복 없이 다시 구독한다", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const removeSocketListener = vi.fn();
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
});
