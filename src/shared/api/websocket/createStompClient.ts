import { Client } from "@stomp/stompjs";
import { WEB_SOCKET_URL } from "@/src/shared/api/config";

type CreateStompClientOptions = {
  debugLabel?: string;
  reconnectDelay?: number;
};

export const DEFAULT_STOMP_RECONNECT_DELAY_MS = 5000;

function createDebugLogger(debugLabel: string) {
  if (process.env.NODE_ENV !== "development") {
    return () => {};
  }

  return (message: string) => {
    const [summary = "STOMP event"] = message.split(/\r?\n/, 1);
    console.debug(`[${debugLabel}]`, summary);
  };
}

export function createStompClient({
  debugLabel = "STOMP",
  reconnectDelay = DEFAULT_STOMP_RECONNECT_DELAY_MS,
}: CreateStompClientOptions = {}) {
  return new Client({
    brokerURL: WEB_SOCKET_URL,
    reconnectDelay,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    debug: createDebugLogger(debugLabel),
  });
}
