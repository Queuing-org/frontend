import type { IMessage, StompSubscription } from "@stomp/stompjs";
import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";

const FOLLOW_PRESENCE_DESTINATION = "/user/queue/follow-presence";

export function subscribeFollowPresence(
  onMessage: (message: IMessage) => void,
): StompSubscription {
  return getSocketClient().subscribe(FOLLOW_PRESENCE_DESTINATION, onMessage);
}
