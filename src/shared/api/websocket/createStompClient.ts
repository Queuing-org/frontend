import { Client } from "@stomp/stompjs";

type CreateStompClientOptions = {
  debugLabel?: string;
};

export function createStompClient({
  debugLabel = "STOMP",
}: CreateStompClientOptions = {}) {
  return new Client({
    brokerURL: process.env.NEXT_PUBLIC_WS_URL,
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    debug: (message) => {
      console.log(`[${debugLabel}]`, message);
    },
  });
}
