import type { RoomTag } from "./types";

const FREE_ROOM_TAG: RoomTag = {
  slug: "free",
  name: "FREE",
};

export function getDisplayRoomTags(tags: readonly RoomTag[]): readonly RoomTag[] {
  return tags.length > 0 ? tags : [FREE_ROOM_TAG];
}
