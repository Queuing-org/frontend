import type { IMessage, StompSubscription } from "@stomp/stompjs";
import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";

const USER_EVENTS_DESTINATION = "/user/playlist/events";

export function subscribeUserRoomEvents(
  onMessage: (message: IMessage) => void,
): StompSubscription {
  const client = getSocketClient();

  return client.subscribe(USER_EVENTS_DESTINATION, onMessage);
}
