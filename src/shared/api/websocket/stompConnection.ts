import { Client } from "@stomp/stompjs";

const client = new Client({
  brokerURL: process.env.NEXT_PUBLIC_WS_URL,
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
});

client.onConnect = () => {
  console.log("STOMP connected");
};

client.onStompError = (frame) => {
  console.error("STOMP error:", frame.headers["message"], frame.body);
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
