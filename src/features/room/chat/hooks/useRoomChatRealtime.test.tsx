import { act, renderHook } from "@testing-library/react";
import type { IMessage, StompSubscription } from "@stomp/stompjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { publishChatMessage } from "@/src/features/room/api/websocket/publishChatMessage";
import { subscribeRoomChatEvents } from "@/src/features/room/api/websocket/subscribeRoomChatEvents";
import { subscribeUserRoomEvents } from "@/src/features/room/api/websocket/subscribeUserRoomEvents";
import { useRoomChatRealtime } from "./useRoomChatRealtime";

const websocket = vi.hoisted(() => ({
  userEventHandler: null as ((message: IMessage) => void) | null,
  chatEventHandler: null as ((message: IMessage) => void) | null,
  chatSubscriptions: [] as StompSubscription[],
  userSubscriptions: [] as StompSubscription[],
  onMessageDeleted: vi.fn(),
}));
const { notify } = vi.hoisted(() => ({ notify: vi.fn() }));

vi.mock("@/src/features/room/api/websocket/publishChatMessage", () => ({
  publishChatMessage: vi.fn(),
}));
vi.mock("@/src/features/room/api/websocket/subscribeRoomChatEvents", () => ({
  subscribeRoomChatEvents: vi.fn((_slug, handler: (message: IMessage) => void) => {
    websocket.chatEventHandler = handler;
    const subscription = createSubscription();
    websocket.chatSubscriptions.push(subscription);
    return subscription;
  }),
}));
vi.mock("@/src/features/room/api/websocket/subscribeRoomEvents", () => ({
  subscribeRoomEvents: vi.fn(() => createSubscription()),
}));
vi.mock("@/src/features/room/api/websocket/subscribeUserRoomEvents", () => ({
  subscribeUserRoomEvents: vi.fn((handler: (message: IMessage) => void) => {
    websocket.userEventHandler = handler;
    const subscription = createSubscription();
    websocket.userSubscriptions.push(subscription);
    return subscription;
  }),
}));
vi.mock("@/src/shared/ui/action-feedback/ActionFeedbackProvider", () => ({
  useActionFeedback: () => ({ notify }),
}));

function createSubscription() {
  return {
    id: "subscription",
    unsubscribe: vi.fn(),
  } as unknown as StompSubscription;
}

function createErrorEvent(code: string, message: string, statusCode: number) {
  return {
    body: JSON.stringify({
      data: { code, message, statusCode },
      roomSlug: "room",
      timestamp: 1,
      type: "ERROR",
    }),
  } as IMessage;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

function renderRealtimeChat(
  onPendingMessageBackfill = vi.fn(async () => [] as string[]),
) {
  const onMessage = vi.fn();
  const currentUser = {
    nickname: "사용자",
    profileImageUrl: null,
    slug: "user",
  };

  return renderHook(() =>
    useRoomChatRealtime({
      currentUser,
      isEnabled: true,
      onMessage,
      onMessageDeleted: websocket.onMessageDeleted,
      onPendingMessageBackfill,
      roomAccessToken: "access-token",
      slug: "room",
    }),
  );
}

describe("useRoomChatRealtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    websocket.userEventHandler = null;
    websocket.chatEventHandler = null;
    websocket.chatSubscriptions = [];
    websocket.userSubscriptions = [];
  });

  it("같은 방의 callback이 바뀌어도 구독을 유지하고 최신 callback으로 전달한다", () => {
    const currentUser = {
      nickname: "사용자",
      profileImageUrl: null,
      slug: "user",
    };
    const firstOnMessage = vi.fn();
    const secondOnMessage = vi.fn();
    const firstOnMessageDeleted = vi.fn();
    const secondOnMessageDeleted = vi.fn();
    const onPendingMessageBackfill = vi.fn(async () => [] as string[]);
    const { rerender, unmount } = renderHook(
      ({
        onMessage,
        onMessageDeleted,
      }: {
        onMessage: typeof firstOnMessage;
        onMessageDeleted: typeof firstOnMessageDeleted;
      }) =>
        useRoomChatRealtime({
          currentUser,
          isEnabled: true,
          onMessage,
          onMessageDeleted,
          onPendingMessageBackfill,
          roomAccessToken: "access-token",
          slug: "room",
        }),
      {
        initialProps: {
          onMessage: firstOnMessage,
          onMessageDeleted: firstOnMessageDeleted,
        },
      },
    );
    const initialSubscription = websocket.chatSubscriptions[0];

    rerender({
      onMessage: secondOnMessage,
      onMessageDeleted: secondOnMessageDeleted,
    });

    expect(subscribeRoomChatEvents).toHaveBeenCalledOnce();
    expect(initialSubscription.unsubscribe).not.toHaveBeenCalled();

    act(() => {
      websocket.chatEventHandler?.({
        body: JSON.stringify({
          data: {
            content: "렌더 이후 메시지",
            messageId: 1,
            messageType: "TEXT",
            senderNickname: "다른 사용자",
            senderProfileImageUrl: null,
            senderSlug: "other-user",
            sentAt: 1,
          },
          roomSlug: "room",
          timestamp: 1,
          type: "CHAT_MESSAGE",
        }),
      } as IMessage);
      websocket.chatEventHandler?.({
        body: JSON.stringify({
          data: {
            content: "삭제된 채팅입니다.",
            deletedAt: 2,
            messageKey: "message-2",
          },
          roomSlug: "room",
          timestamp: 2,
          type: "CHAT_MESSAGE_DELETED",
        }),
      } as IMessage);
    });

    expect(firstOnMessage).not.toHaveBeenCalled();
    expect(secondOnMessage).toHaveBeenCalledOnce();
    expect(firstOnMessageDeleted).not.toHaveBeenCalled();
    expect(secondOnMessageDeleted).toHaveBeenCalledWith({
      content: "삭제된 채팅입니다.",
      deletedAt: 2,
      messageKey: "message-2",
    });

    unmount();
    expect(initialSubscription.unsubscribe).toHaveBeenCalledOnce();
  });

  it("room access token이 바뀔 때만 채팅 구독을 교체하고 user 구독은 유지한다", () => {
    const currentUser = {
      nickname: "사용자",
      profileImageUrl: null,
      slug: "user",
    };
    const { rerender, unmount } = renderHook(
      ({ roomAccessToken }: { roomAccessToken: string }) =>
        useRoomChatRealtime({
          currentUser,
          isEnabled: true,
          onMessage: vi.fn(),
          onMessageDeleted: websocket.onMessageDeleted,
          onPendingMessageBackfill: vi.fn(async () => [] as string[]),
          roomAccessToken,
          slug: "room",
        }),
      { initialProps: { roomAccessToken: "first-token" } },
    );
    const firstSubscription = websocket.chatSubscriptions[0];
    const userSubscription = websocket.userSubscriptions[0];

    rerender({ roomAccessToken: "second-token" });

    expect(subscribeRoomChatEvents).toHaveBeenCalledTimes(2);
    expect(firstSubscription.unsubscribe).toHaveBeenCalledOnce();
    expect(subscribeUserRoomEvents).toHaveBeenCalledOnce();
    expect(userSubscription.unsubscribe).not.toHaveBeenCalled();

    const secondSubscription = websocket.chatSubscriptions[1];
    unmount();
    expect(secondSubscription.unsubscribe).toHaveBeenCalledOnce();
    expect(userSubscription.unsubscribe).toHaveBeenCalledOnce();
  });

  it("같은 사용자 slug에서 사용자 객체만 바뀌면 구독과 pending을 유지한다", () => {
    vi.useFakeTimers();
    const firstUser = {
      nickname: "사용자",
      profileImageUrl: null,
      slug: "user",
    };
    const { result, rerender, unmount } = renderHook(
      ({ currentUser }: { currentUser: typeof firstUser }) =>
        useRoomChatRealtime({
          currentUser,
          isEnabled: true,
          onMessage: vi.fn(),
          onMessageDeleted: websocket.onMessageDeleted,
          onPendingMessageBackfill: vi.fn(async () => [] as string[]),
          roomAccessToken: "access-token",
          slug: "room",
        }),
      { initialProps: { currentUser: firstUser } },
    );
    const chatSubscription = websocket.chatSubscriptions[0];
    const userSubscription = websocket.userSubscriptions[0];

    act(() => {
      expect(result.current.sendMessage("전송 확인 대기")).toBe(true);
    });
    expect(vi.getTimerCount()).toBe(1);

    rerender({
      currentUser: {
        ...firstUser,
        nickname: "변경된 사용자",
      },
    });

    expect(subscribeRoomChatEvents).toHaveBeenCalledOnce();
    expect(subscribeUserRoomEvents).toHaveBeenCalledOnce();
    expect(chatSubscription.unsubscribe).not.toHaveBeenCalled();
    expect(userSubscription.unsubscribe).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("사용자 slug가 사라지면 채팅 구독은 유지하고 user 구독과 pending을 정리한다", async () => {
    vi.useFakeTimers();
    const currentUser = {
      nickname: "사용자",
      profileImageUrl: null,
      slug: "user",
    };
    const { result, rerender, unmount } = renderHook(
      ({ user }: { user: typeof currentUser | null }) =>
        useRoomChatRealtime({
          currentUser: user,
          isEnabled: true,
          onMessage: vi.fn(),
          onMessageDeleted: websocket.onMessageDeleted,
          onPendingMessageBackfill: vi.fn(async () => [] as string[]),
          roomAccessToken: "access-token",
          slug: "room",
        }),
      { initialProps: { user: currentUser as typeof currentUser | null } },
    );
    const chatSubscription = websocket.chatSubscriptions[0];
    const userSubscription = websocket.userSubscriptions[0];

    act(() => {
      expect(result.current.sendMessage("로그아웃 전 전송")).toBe(true);
    });
    expect(vi.getTimerCount()).toBe(1);

    rerender({ user: null });

    expect(subscribeRoomChatEvents).toHaveBeenCalledOnce();
    expect(chatSubscription.unsubscribe).not.toHaveBeenCalled();
    expect(userSubscription.unsubscribe).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });
    expect(result.current.sendErrorMessage).toBe("");
    expect(notify).not.toHaveBeenCalled();

    unmount();
    expect(chatSubscription.unsubscribe).toHaveBeenCalledOnce();
  });

  it("room slug가 바뀌면 두 구독을 교체하고 이전 pending을 정리한다", () => {
    vi.useFakeTimers();
    const currentUser = {
      nickname: "사용자",
      profileImageUrl: null,
      slug: "user",
    };
    const { result, rerender, unmount } = renderHook(
      ({ slug }: { slug: string }) =>
        useRoomChatRealtime({
          currentUser,
          isEnabled: true,
          onMessage: vi.fn(),
          onMessageDeleted: websocket.onMessageDeleted,
          onPendingMessageBackfill: vi.fn(async () => [] as string[]),
          roomAccessToken: "access-token",
          slug,
        }),
      { initialProps: { slug: "first-room" } },
    );
    const firstChatSubscription = websocket.chatSubscriptions[0];
    const firstUserSubscription = websocket.userSubscriptions[0];

    act(() => {
      expect(result.current.sendMessage("방 이동 전 전송")).toBe(true);
    });
    rerender({ slug: "second-room" });

    expect(subscribeRoomChatEvents).toHaveBeenCalledTimes(2);
    expect(subscribeUserRoomEvents).toHaveBeenCalledTimes(2);
    expect(firstChatSubscription.unsubscribe).toHaveBeenCalledOnce();
    expect(firstUserSubscription.unsubscribe).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);

    unmount();
  });

  it("비활성화되면 두 구독과 이전 pending을 정리한다", () => {
    vi.useFakeTimers();
    const currentUser = {
      nickname: "사용자",
      profileImageUrl: null,
      slug: "user",
    };
    const { result, rerender, unmount } = renderHook(
      ({ isEnabled }: { isEnabled: boolean }) =>
        useRoomChatRealtime({
          currentUser,
          isEnabled,
          onMessage: vi.fn(),
          onMessageDeleted: websocket.onMessageDeleted,
          onPendingMessageBackfill: vi.fn(async () => [] as string[]),
          roomAccessToken: "access-token",
          slug: "room",
        }),
      { initialProps: { isEnabled: true } },
    );
    const chatSubscription = websocket.chatSubscriptions[0];
    const userSubscription = websocket.userSubscriptions[0];

    act(() => {
      expect(result.current.sendMessage("비활성화 전 전송")).toBe(true);
    });
    rerender({ isEnabled: false });

    expect(chatSubscription.unsubscribe).toHaveBeenCalledOnce();
    expect(userSubscription.unsubscribe).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);

    unmount();
  });

  it("CHAT_MESSAGE_DELETED를 chat topic에서 삭제 callback으로 전달한다", () => {
    const { unmount } = renderRealtimeChat();
    act(() => {
      websocket.chatEventHandler?.({
        body: JSON.stringify({
          type: "CHAT_MESSAGE_DELETED",
          roomSlug: "room",
          timestamp: 1,
          data: { messageKey: "message-1", content: "삭제된 채팅입니다.", deletedAt: 1 },
        }),
      } as IMessage);
    });
    expect(websocket.onMessageDeleted).toHaveBeenCalledWith({
      messageKey: "message-1", content: "삭제된 채팅입니다.", deletedAt: 1,
    });
    unmount();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("invalid-input은 pending을 종료하되 하단 오류 문구로 노출하지 않는다", async () => {
    vi.useFakeTimers();
    const { result, unmount } = renderRealtimeChat();

    act(() => {
      expect(result.current.sendMessage("금칙어 포함 채팅")).toBe(true);
    });
    expect(publishChatMessage).toHaveBeenCalledOnce();
    expect(subscribeUserRoomEvents).toHaveBeenCalledOnce();

    act(() => {
      websocket.userEventHandler?.(
        createErrorEvent("invalid-input", "잘못된 입력값이에요.", 400),
      );
    });

    expect(result.current.sendErrorMessage).toBe("");

    await act(async () => {
      vi.advanceTimersByTime(8_000);
      await Promise.resolve();
    });
    expect(result.current.sendErrorMessage).toBe("");
    unmount();
  });

  it("다른 전송 오류는 공통 오류 알림으로 노출한다", () => {
    const { result, unmount } = renderRealtimeChat();

    act(() => {
      result.current.sendMessage("일반 채팅");
      websocket.userEventHandler?.(
        createErrorEvent(
          "chat.send-failed",
          "채팅을 전송하지 못했습니다.",
          500,
        ),
      );
    });

    expect(result.current.sendErrorMessage).toBe(
      "채팅을 전송하지 못했습니다.",
    );
    expect(notify).toHaveBeenCalledWith({
      dedupeKey: "chat-send:room",
      message: "채팅을 전송하지 못했습니다.",
      tone: "error",
    });
    unmount();
  });

  it("pending 전송 burst를 방 단위 timer와 single-flight backfill로 합친다", async () => {
    vi.useFakeTimers();
    const backfill = vi.fn(async () => [] as string[]);
    const { result, unmount } = renderRealtimeChat(backfill);

    act(() => {
      for (let index = 0; index < 20; index += 1) {
        expect(result.current.sendMessage(`메시지 ${index}`)).toBe(true);
      }
    });

    expect(vi.getTimerCount()).toBe(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(backfill).toHaveBeenCalledTimes(1);
    expect(backfill).toHaveBeenLastCalledWith(
      Array.from({ length: 20 }, (_, index) => `메시지 ${index}`),
    );
    expect(vi.getTimerCount()).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6_000);
    });
    expect(backfill).toHaveBeenCalledTimes(1);
    expect(result.current.sendErrorMessage).toBe("채팅 전송을 확인하지 못했습니다.");
    expect(result.current.isSending).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    unmount();
  });

  it("in-flight snapshot 뒤 등록된 동일 내용 pending은 이전 결과로 해소하지 않고 후속 backfill한다", async () => {
    vi.useFakeTimers();
    const firstBackfill = createDeferred<readonly string[]>();
    const secondBackfill = createDeferred<readonly string[]>();
    const backfill = vi
      .fn<(contents: readonly string[]) => Promise<readonly string[]>>()
      .mockImplementationOnce(() => firstBackfill.promise)
      .mockImplementationOnce(() => secondBackfill.promise);
    const { result, unmount } = renderRealtimeChat(backfill);

    act(() => {
      expect(result.current.sendMessage("같은 내용")).toBe(true);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(backfill).toHaveBeenCalledTimes(1);
    expect(backfill).toHaveBeenLastCalledWith(["같은 내용"]);

    act(() => {
      expect(result.current.sendMessage("같은 내용")).toBe(true);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(backfill).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4_000);
    });
    expect(result.current.sendErrorMessage).toBe("채팅 전송을 확인하지 못했습니다.");
    expect(result.current.isSending).toBe(false);
    expect(backfill).toHaveBeenCalledTimes(2);
    expect(backfill).toHaveBeenLastCalledWith(["같은 내용"]);

    await act(async () => {
      firstBackfill.resolve(["같은 내용"]);
      await firstBackfill.promise;
      await Promise.resolve();
    });
    expect(backfill).toHaveBeenCalledTimes(2);
    expect(result.current.sendErrorMessage).toBe("채팅 전송을 확인하지 못했습니다.");
    unmount();
  });

  it("backfill이 끝나지 않아도 등록 후 8초에 pending을 종료한다", async () => {
    vi.useFakeTimers();
    const deferredBackfill = createDeferred<readonly string[]>();
    const backfill = vi
      .fn<(contents: readonly string[]) => Promise<readonly string[]>>()
      .mockImplementationOnce(() => deferredBackfill.promise)
      .mockResolvedValueOnce([]);
    const { result, unmount } = renderRealtimeChat(backfill);

    act(() => {
      expect(result.current.sendMessage("응답 없는 backfill")).toBe(true);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(backfill).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6_000);
    });
    expect(result.current.sendErrorMessage).toBe("채팅 전송을 확인하지 못했습니다.");
    expect(result.current.isSending).toBe(false);
    expect(vi.getTimerCount()).toBe(0);

    act(() => {
      expect(result.current.sendMessage("후속 전송")).toBe(true);
    });
    expect(result.current.sendErrorMessage).toBe("");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(backfill).toHaveBeenCalledTimes(2);
    expect(backfill).toHaveBeenLastCalledWith(["후속 전송"]);
    expect(vi.getTimerCount()).toBe(1);

    await act(async () => {
      deferredBackfill.resolve(["응답 없는 backfill"]);
      await Promise.resolve();
    });
    expect(result.current.sendErrorMessage).toBe("");
    expect(vi.getTimerCount()).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6_000);
    });
    expect(result.current.sendErrorMessage).toBe("채팅 전송을 확인하지 못했습니다.");
    expect(result.current.isSending).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    unmount();
  });

  it("in-flight backfill 중 unmount하면 deadline timer와 stale 결과를 정리한다", async () => {
    vi.useFakeTimers();
    const deferredBackfill = createDeferred<readonly string[]>();
    const backfill = vi.fn(() => deferredBackfill.promise);
    const { result, unmount } = renderRealtimeChat(backfill);

    act(() => {
      expect(result.current.sendMessage("화면 이탈")).toBe(true);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(backfill).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);

    await act(async () => {
      deferredBackfill.resolve(["화면 이탈"]);
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(6_000);
    });
    expect(vi.getTimerCount()).toBe(0);
  });
});
