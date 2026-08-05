import type { Room, RoomMeta } from "./types";

export function mergeRoomMeta(room: Room, roomMeta?: RoomMeta | null): Room {
  if (!roomMeta || roomMeta.slug !== room.slug) {
    return room;
  }

  return {
    ...room,
    isPrivate: roomMeta.hasPassword,
    tags: roomMeta.tags,
    title: roomMeta.title,
    thumbnailUrl:
      roomMeta.thumbnailUrl === undefined
        ? room.thumbnailUrl
        : roomMeta.thumbnailUrl,
    thumbnailUrls:
      roomMeta.thumbnailUrls === undefined
        ? room.thumbnailUrls
        : roomMeta.thumbnailUrls,
  };
}
