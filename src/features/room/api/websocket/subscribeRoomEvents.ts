import type { IMessage, StompSubscription } from "@stomp/stompjs";
import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";
import { buildRoomAccessTokenSubscriptionHeaders } from "@/src/shared/api/websocket/roomAccessTokenSubscriptionHeaders";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

// join 완료 후 방 토픽 이벤트를 계속 수신한다.
export function subscribeRoomEvents(
  safeSlug: string,
  onMessage: (message: IMessage) => void,
  accessToken: string,
): StompSubscription {
  const client = getSocketClient();
  const destination = `/topic/room/${encodeURIComponent(
    normalizeRoomSlug(safeSlug),
  )}/events`;

  return client.subscribe(
    destination,
    onMessage,
    buildRoomAccessTokenSubscriptionHeaders(accessToken),
  );
}
