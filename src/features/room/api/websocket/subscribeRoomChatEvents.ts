import type { IMessage, StompSubscription } from "@stomp/stompjs";
import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";
import { buildRoomAccessTokenSubscriptionHeaders } from "@/src/shared/api/websocket/roomAccessTokenSubscriptionHeaders";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export function subscribeRoomChatEvents(
  safeSlug: string,
  onMessage: (message: IMessage) => void,
  accessToken: string,
): StompSubscription {
  const client = getSocketClient();
  const destination = `/topic/room/${encodeURIComponent(
    normalizeRoomSlug(safeSlug),
  )}/chat`;

  return client.subscribe(
    destination,
    onMessage,
    buildRoomAccessTokenSubscriptionHeaders(accessToken),
  );
}
