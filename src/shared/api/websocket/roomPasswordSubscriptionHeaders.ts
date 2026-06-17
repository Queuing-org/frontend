import { buildRoomPasswordHeaders } from "@/src/shared/api/roomPasswordHeaders";

export function buildRoomPasswordSubscriptionHeaders(
  password?: string | null,
) {
  return buildRoomPasswordHeaders(password);
}
