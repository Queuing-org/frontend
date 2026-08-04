import type { IFrame } from "@stomp/stompjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addSocketListener,
  connectSocket,
  getSocketClient,
} from "@/src/shared/api/websocket/stompConnection";
import { publishJoinRequest } from "./websocket/publishJoinRequest";
import { publishLeaveRequest } from "./websocket/publishLeaveRequest";
import {
  subscribeUserJoinEvents,
  type JoinHandlers,
} from "./websocket/subscribeUserJoinEvents";
import { joinRoom } from "./joinRoom";

vi.mock("@/src/shared/api/websocket/stompConnection", () => ({
  addSocketListener: vi.fn(),
  connectSocket: vi.fn(),
  getSocketClient: vi.fn(),
}));
vi.mock("./websocket/publishJoinRequest", () => ({
  publishJoinRequest: vi.fn(),
}));
vi.mock("./websocket/publishLeaveRequest", () => ({
  publishLeaveRequest: vi.fn(),
}));
vi.mock("./websocket/subscribeUserJoinEvents", () => ({
  subscribeUserJoinEvents: vi.fn(),
}));

describe("joinRoom socket lifecycle", () => {
  const client = {
    active: true,
    connected: false,
  };
  let socketListeners: Parameters<typeof addSocketListener>[0][];
  let joinHandlers: JoinHandlers | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    client.active = true;
    client.connected = false;
    socketListeners = [];
    joinHandlers = undefined;

    vi.mocked(getSocketClient).mockReturnValue(client as never);
    vi.mocked(addSocketListener).mockImplementation((listener) => {
      socketListeners.push(listener);
      return vi.fn();
    });
    vi.mocked(subscribeUserJoinEvents).mockImplementation(
      (_slug, handlers) => {
        joinHandlers = handlers;
        return { unsubscribe: vi.fn() } as never;
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("전역 client 재연결 지연 5초가 지나도 다음 onConnect를 기다린다", async () => {
    const request = joinRoom("room");
    await vi.advanceTimersByTimeAsync(5_000);

    expect(publishJoinRequest).not.toHaveBeenCalled();
    expect(connectSocket).not.toHaveBeenCalled();

    client.connected = true;
    socketListeners[0]?.onConnect?.({} as IFrame);
    await vi.advanceTimersByTimeAsync(0);

    expect(subscribeUserJoinEvents).toHaveBeenCalledWith(
      "room",
      expect.any(Object),
    );
    expect(publishJoinRequest).toHaveBeenCalledWith("room", {});
    expect(
      vi.mocked(subscribeUserJoinEvents).mock.invocationCallOrder[0],
    ).toBeLessThan(vi.mocked(publishJoinRequest).mock.invocationCallOrder[0]);

    joinHandlers?.onJoined({
      roomSlug: "room",
      timestamp: 1,
      data: null,
    });

    await expect(request).resolves.toMatchObject({ roomSlug: "room" });
  });

  it("join publish 뒤 취소되면 같은 socket session에 leave를 보낸다", async () => {
    client.connected = true;
    const abortController = new AbortController();
    const request = joinRoom("room", {}, { signal: abortController.signal });
    await vi.advanceTimersByTimeAsync(0);

    expect(publishJoinRequest).toHaveBeenCalledWith("room", {});
    abortController.abort();

    await expect(request).rejects.toMatchObject({
      code: "room.join-cancelled",
    });
    expect(publishLeaveRequest).toHaveBeenCalledWith("room");
  });

  it("상위 room session owner가 leave를 맡으면 abort에서 중복 발행하지 않는다", async () => {
    client.connected = true;
    const abortController = new AbortController();
    const request = joinRoom(
      "room",
      {},
      {
        leaveOnAbort: false,
        signal: abortController.signal,
      },
    );
    await vi.advanceTimersByTimeAsync(0);
    abortController.abort();

    await expect(request).rejects.toMatchObject({
      code: "room.join-cancelled",
    });
    expect(publishLeaveRequest).not.toHaveBeenCalled();
  });

  it("join 응답 timeout도 처리됐을 수 있는 participant를 leave로 정리한다", async () => {
    client.connected = true;
    const request = joinRoom("room");
    const rejection = expect(request).rejects.toMatchObject({
      code: "room.join-timeout",
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(publishJoinRequest).toHaveBeenCalledWith("room", {});
    expect(publishJoinRequest).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(7_999);
    expect(publishLeaveRequest).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await rejection;
    expect(publishLeaveRequest).toHaveBeenCalledWith("room");
    expect(publishLeaveRequest).toHaveBeenCalledTimes(1);
  });
});
