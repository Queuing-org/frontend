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
      onPendingMessageBackfill,
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
    expect(result.current.sendErrorMessage).toContain("전송 확인이 지연");
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
    expect(result.current.sendErrorMessage).toContain("전송 확인이 지연");
    expect(backfill).toHaveBeenCalledTimes(2);
    expect(backfill).toHaveBeenLastCalledWith(["같은 내용"]);

    await act(async () => {
      firstBackfill.resolve(["같은 내용"]);
      await firstBackfill.promise;
      await Promise.resolve();
    });
    expect(backfill).toHaveBeenCalledTimes(2);
    expect(result.current.sendErrorMessage).toContain("전송 확인이 지연");
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
    expect(result.current.sendErrorMessage).toContain("전송 확인이 지연");
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
    expect(result.current.sendErrorMessage).toContain("전송 확인이 지연");
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
