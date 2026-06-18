import type { RoomListQueryParams } from "../api/fetchRooms";

export const roomKeys = {
  all: () => ["rooms"] as const,
  delete: () => ["rooms", "delete"] as const,
  list: (params: RoomListQueryParams) =>
    [...roomKeys.all(), "list", params] as const,
  meta: (slug: string | null) => ["roomMeta", slug] as const,
  tags: () => ["roomTags"] as const,
};
