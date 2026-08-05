import { describe, expect, it } from "vitest";
import type { Room, RoomMeta } from "./types";
import { mergeRoomMeta } from "./mergeRoomMeta";

const room: Room = {
  createdAt: "2026-08-05T00:00:00.000Z",
  id: 1,
  isPrivate: false,
  slug: "sample-room",
  tags: [{ name: "기존", slug: "old" }],
  thumbnailUrl: "https://example.com/old.png",
  title: "기존 제목",
};

const roomMeta: RoomMeta = {
  activeUsersCount: 5,
  hasPassword: true,
  isPublic: true,
  owner: null,
  slug: "sample-room",
  tags: [{ name: "새 태그", slug: "new" }],
  thumbnailUrl: "https://example.com/new.png",
  title: "새 제목",
};

describe("mergeRoomMeta", () => {
  it("같은 방의 최신 메타를 목록 항목에 반영한다", () => {
    expect(mergeRoomMeta(room, roomMeta)).toEqual({
      ...room,
      isPrivate: true,
      tags: roomMeta.tags,
      thumbnailUrl: roomMeta.thumbnailUrl,
      thumbnailUrls: undefined,
      title: roomMeta.title,
    });
  });

  it("응답에서 생략된 썸네일 필드는 기존 목록 값을 유지한다", () => {
    expect(
      mergeRoomMeta(room, {
        ...roomMeta,
        thumbnailUrl: undefined,
        thumbnailUrls: undefined,
      }),
    ).toEqual(
      expect.objectContaining({
        thumbnailUrl: room.thumbnailUrl,
      }),
    );
  });

  it("다른 방 메타는 합치지 않는다", () => {
    expect(mergeRoomMeta(room, { ...roomMeta, slug: "another-room" })).toBe(
      room,
    );
  });
});
