import { Client } from "@stomp/stompjs";

const client = new Client({
  brokerURL: process.env.NEXT_PUBLIC_WS_URL,
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
  debug: (message) => {
    console.log("[STOMP]", message);
  },
});

client.onConnect = () => {
  console.log("STOMP connected");
};

client.onStompError = (frame) => {
  console.error("STOMP error:", frame.headers["message"], frame.body);
};

client.onWebSocketError = (event) => {
  console.error("WebSocket error event:", event);
};

client.onWebSocketClose = (event) => {
  console.error("WebSocket closed:", {
    url: process.env.NEXT_PUBLIC_WS_URL,
    code: event.code,
    reason: event.reason,
    wasClean: event.wasClean,
  });
};

export function connectSocket() {
  client.activate();
}

export function disconnectSocket() {
  client.deactivate();
}

export function getSocketClient() {
  return client;
}
