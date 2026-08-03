import { Client } from "@stomp/stompjs";

type CreateStompClientOptions = {
  debugLabel?: string;
  reconnectDelay?: number;
};

export const DEFAULT_STOMP_RECONNECT_DELAY_MS = 5000;

export function createStompClient({
  debugLabel = "STOMP",
  reconnectDelay = DEFAULT_STOMP_RECONNECT_DELAY_MS,
}: CreateStompClientOptions = {}) {
  return new Client({
    brokerURL: process.env.NEXT_PUBLIC_WS_URL,
    reconnectDelay,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    debug: (message) => {
      console.log(`[${debugLabel}]`, message);
    },
  });
}
