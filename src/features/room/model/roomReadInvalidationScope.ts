import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export function getRoomReadInvalidationScope(roomSlug: string) {
  return `room-read:${normalizeRoomSlug(roomSlug)}`;
}
