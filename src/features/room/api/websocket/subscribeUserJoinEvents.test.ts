import { describe, expect, it } from "vitest";
import { parseRoomJoinEvent } from "./subscribeUserJoinEvents";

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
