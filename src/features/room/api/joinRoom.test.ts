import type { IFrame } from "@stomp/stompjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  acquireSocketSession,
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
import { ApiError } from "@/src/shared/api/api-error";

vi.mock("@/src/shared/api/websocket/stompConnection", () => ({
  acquireSocketSession: vi.fn(),
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
  const joinedData = {
    participant: {
      participantType: "USER" as const,
      participantId: "participant",
      userSlug: "user",
      nickname: "사용자",
      profileImageUrl: null,
    },
    recentChatMessages: [],
    roomAccessToken: "access-token",
  };
  const client = {
    active: true,
    connected: false,
  };
  let socketListeners: Parameters<typeof addSocketListener>[0][];
  let joinHandlers: JoinHandlers | undefined;
  let releaseSocketSession: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    client.active = true;
    client.connected = false;
    socketListeners = [];
    joinHandlers = undefined;
    releaseSocketSession = vi.fn();

    vi.mocked(acquireSocketSession).mockReturnValue(releaseSocketSession);
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
      data: joinedData,
    });

    await expect(request).resolves.toMatchObject({ roomSlug: "room" });
    expect(releaseSocketSession).toHaveBeenCalledTimes(1);
  });

  it("재접속 join은 비밀번호 대신 접근 토큰 payload를 그대로 보낸다", async () => {
    client.connected = true;
    const request = joinRoom("room", { accessToken: "access-token" });
    await vi.advanceTimersByTimeAsync(0);

    expect(publishJoinRequest).toHaveBeenCalledWith("room", {
      accessToken: "access-token",
    });
    joinHandlers?.onJoined({
      roomSlug: "room",
      timestamp: 1,
      data: joinedData,
    });

    await expect(request).resolves.toMatchObject({ data: joinedData });
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
    expect(releaseSocketSession).toHaveBeenCalledTimes(1);
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

  it("이미 다른 방에 참가 중인 오류는 새 대상 방에 leave를 보내지 않는다", async () => {
    client.connected = true;
    const request = joinRoom("new-room");
    await vi.advanceTimersByTimeAsync(0);

    joinHandlers?.onError(
      new ApiError({
        status: 409,
        code: "room.already-participating",
        message: "이미 참가 중인 방이 있습니다.",
      }),
    );

    await expect(request).rejects.toMatchObject({
      code: "room.already-participating",
    });
    expect(publishLeaveRequest).not.toHaveBeenCalled();
    expect(releaseSocketSession).toHaveBeenCalledTimes(1);
  });
});
