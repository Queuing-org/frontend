import { act, renderHook } from "@testing-library/react";
import type { IMessage, StompSubscription } from "@stomp/stompjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { publishChatMessage } from "@/src/features/room/api/websocket/publishChatMessage";
import { subscribeUserRoomEvents } from "@/src/features/room/api/websocket/subscribeUserRoomEvents";
import { useRoomChatRealtime } from "./useRoomChatRealtime";

const websocket = vi.hoisted(() => ({
  userEventHandler: null as ((message: IMessage) => void) | null,
}));

vi.mock("@/src/features/room/api/websocket/publishChatMessage", () => ({
  publishChatMessage: vi.fn(),
}));
vi.mock("@/src/features/room/api/websocket/subscribeRoomChatEvents", () => ({
  subscribeRoomChatEvents: vi.fn(() => createSubscription()),
}));
vi.mock("@/src/features/room/api/websocket/subscribeRoomEvents", () => ({
  subscribeRoomEvents: vi.fn(() => createSubscription()),
}));
vi.mock("@/src/features/room/api/websocket/subscribeUserRoomEvents", () => ({
  subscribeUserRoomEvents: vi.fn((handler: (message: IMessage) => void) => {
    websocket.userEventHandler = handler;
    return createSubscription();
  }),
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

function renderRealtimeChat() {
  return renderHook(() =>
    useRoomChatRealtime({
      currentUser: {
        nickname: "사용자",
        profileImageUrl: null,
        slug: "user",
      },
      isEnabled: true,
      onMessage: vi.fn(),
      onPendingMessageBackfill: vi.fn(async () => false),
      slug: "room",
    }),
  );
}

describe("useRoomChatRealtime 전송 오류 표시", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    websocket.userEventHandler = null;
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

  it("다른 전송 오류는 기존처럼 하단 문구로 노출한다", () => {
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
    unmount();
  });
});
