import { describe, expect, it, vi } from "vitest";
import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";
import { RoomJoinError } from "../joinRoom.types";
import {
  parseRoomJoinEvent,
  subscribeUserJoinEvents,
} from "./subscribeUserJoinEvents";

vi.mock("@/src/shared/api/websocket/stompConnection", () => ({
  getSocketClient: vi.fn(),
}));

describe("parseRoomJoinEvent", () => {
  it("필수 roomSlug와 timestamp가 있는 join 사건만 허용한다", () => {
    expect(
      parseRoomJoinEvent(
        JSON.stringify({
          type: "ROOM_JOINED",
          roomSlug: "room",
          timestamp: 1,
          data: null,
        }),
      ),
    ).toMatchObject({ roomSlug: "room", timestamp: 1 });
    expect(
      parseRoomJoinEvent(
        JSON.stringify({ type: "ROOM_JOINED", timestamp: 1, data: null }),
      ),
    ).toBeNull();
    expect(
      parseRoomJoinEvent(
        JSON.stringify({ type: "ROOM_JOINED", roomSlug: "room", data: null }),
      ),
    ).toBeNull();
    expect(
      parseRoomJoinEvent(
        JSON.stringify({
          type: "ROOM_JOINED",
          roomSlug: "room",
          timestamp: 1,
        }),
      ),
    ).toBeNull();
    expect(
      parseRoomJoinEvent(
        JSON.stringify({
          type: "ROOM_JOIN_FAILED",
          roomSlug: "room",
          timestamp: 1,
          data: null,
        }),
      ),
    ).toBeNull();
  });
});

it("join ERROR의 기존 방 slug와 title을 전용 오류에 보존한다", () => {
  let onMessage: ((message: { body: string }) => void) | undefined;
  vi.mocked(getSocketClient).mockReturnValue({
    subscribe: vi.fn((_destination, callback) => {
      onMessage = callback;
      return { unsubscribe: vi.fn() };
    }),
  } as never);
  const onError = vi.fn();

  subscribeUserJoinEvents("next-room", {
    onError,
    onJoined: vi.fn(),
  });
  onMessage?.({
    body: JSON.stringify({
      type: "ERROR",
      roomSlug: "next-room",
      timestamp: 1,
      data: {
        statusCode: 409,
        code: "room.already-participating",
        message: "이미 참여 중인 방이 있습니다.",
        slug: "current-room",
        title: "현재 방",
      },
    }),
  });

  const error = onError.mock.calls[0]?.[0];
  expect(error).toBeInstanceOf(RoomJoinError);
  expect(error).toMatchObject({
    code: "room.already-participating",
    data: { slug: "current-room", title: "현재 방" },
  });
});

it("ROOM_JOINED의 participant와 접근 토큰을 검증해 보존한다", () => {
  let onMessage: ((message: { body: string }) => void) | undefined;
  vi.mocked(getSocketClient).mockReturnValue({
    subscribe: vi.fn((_destination, callback) => {
      onMessage = callback;
      return { unsubscribe: vi.fn() };
    }),
  } as never);
  const onError = vi.fn();
  const onJoined = vi.fn();

  subscribeUserJoinEvents("room", { onError, onJoined });
  onMessage?.({
    body: JSON.stringify({
      type: "ROOM_JOINED",
      roomSlug: "room",
      timestamp: 1,
      data: {
        participant: {
          participantType: "USER",
          participantId: "participant",
          userSlug: "user",
          nickname: "사용자",
          profileImageUrl: null,
        },
        recentChatMessages: [],
        roomAccessToken: "access-token",
      },
    }),
  });

  expect(onJoined).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ roomAccessToken: "access-token" }),
    }),
  );
  expect(onError).not.toHaveBeenCalled();

  onMessage?.({
    body: JSON.stringify({
      type: "ROOM_JOINED",
      roomSlug: "room",
      timestamp: 2,
      data: { recentChatMessages: [] },
    }),
  });
  expect(onError).toHaveBeenCalledWith(
    expect.objectContaining({ code: "room.invalid-join-response" }),
  );
});
