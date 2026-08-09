import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  acquireSocketSession,
  addSocketListener,
  getSocketClient,
} from "./stompConnection";

const { client } = vi.hoisted(() => ({
  client: {
    activate: vi.fn(),
    deactivate: vi.fn(() => Promise.resolve()),
    reconnectDelay: 0,
  },
}));

vi.mock("./createStompClient", () => ({
  createStompClient: vi.fn(() => client),
  DEFAULT_STOMP_RECONNECT_DELAY_MS: 5000,
}));

describe("room STOMP connection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("마지막 room session의 idle timeout 뒤에만 transport를 비활성화한다", () => {
    const releaseFirst = acquireSocketSession();
    const releaseSecond = acquireSocketSession();

    releaseFirst();
    vi.advanceTimersByTime(1_000);
    expect(client.deactivate).not.toHaveBeenCalled();

    releaseSecond();
    vi.advanceTimersByTime(999);
    expect(client.deactivate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(client.deactivate).toHaveBeenCalledTimes(1);

    releaseSecond();
    expect(client.deactivate).toHaveBeenCalledTimes(1);
  });

  it("Promise handoff 뒤 새 room session이 생기면 예약된 비활성화를 취소한다", async () => {
    const releaseFirst = acquireSocketSession();
    releaseFirst();
    await Promise.resolve();
    const releaseSecond = acquireSocketSession();

    vi.advanceTimersByTime(1_000);
    expect(client.deactivate).not.toHaveBeenCalled();

    releaseSecond();
    vi.advanceTimersByTime(1_000);
    expect(client.deactivate).toHaveBeenCalledTimes(1);
  });

  it("broker와 transport 오류 로그에 frame body나 close reason을 남기지 않는다", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const listener = {
      onStompError: vi.fn(),
      onWebSocketClose: vi.fn(),
    };
    const removeListener = addSocketListener(listener);
    const socketClient = getSocketClient();

    socketClient.onStompError({
      headers: { message: "broker rejected request" },
      body: "private message body",
    } as never);
    socketClient.onWebSocketClose({
      code: 1006,
      reason: "private close reason",
      wasClean: false,
    } as CloseEvent);

    expect(listener.onStompError).toHaveBeenCalledOnce();
    expect(listener.onWebSocketClose).toHaveBeenCalledOnce();
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "private message body",
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "private close reason",
    );
    removeListener();
  });
});
