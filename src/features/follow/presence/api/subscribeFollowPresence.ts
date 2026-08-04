import type {
  Client,
  IMessage,
  StompSubscription,
} from "@stomp/stompjs";

const FOLLOW_PRESENCE_DESTINATION = "/user/queue/follow-presence";

export function subscribeFollowPresence(
  client: Client,
  onMessage: (message: IMessage) => void,
): StompSubscription {
  return client.subscribe(FOLLOW_PRESENCE_DESTINATION, onMessage);
}
