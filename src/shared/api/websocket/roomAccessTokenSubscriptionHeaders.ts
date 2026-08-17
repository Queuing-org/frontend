import { buildRoomAccessTokenHeaders } from "@/src/shared/api/roomAccessTokenHeaders";

export function buildRoomAccessTokenSubscriptionHeaders(
  accessToken?: string | null,
) {
  return buildRoomAccessTokenHeaders(accessToken);
}
