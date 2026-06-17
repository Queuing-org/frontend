import type { IMessage, StompSubscription } from "@stomp/stompjs";
import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";
import { buildRoomPasswordSubscriptionHeaders } from "@/src/shared/api/websocket/roomPasswordSubscriptionHeaders";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export function subscribeRoomChatEvents(
  safeSlug: string,
  onMessage: (message: IMessage) => void,
  password?: string | null,
): StompSubscription {
  const client = getSocketClient();
  const destination = `/topic/room/${encodeURIComponent(
    normalizeRoomSlug(safeSlug),
  )}/chat`;

  return client.subscribe(
    destination,
    onMessage,
    buildRoomPasswordSubscriptionHeaders(password),
  );
}
