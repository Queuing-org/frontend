import type { IMessage, StompSubscription } from "@stomp/stompjs";
import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";

// join 완료 후 방 토픽 이벤트를 계속 수신한다.
export function subscribeRoomEvents(
  safeSlug: string,
  onMessage: (message: IMessage) => void,
): StompSubscription {
  const client = getSocketClient();
  const destination = `/topic/room/${encodeURIComponent(safeSlug)}/events`;

  return client.subscribe(destination, onMessage);
}
