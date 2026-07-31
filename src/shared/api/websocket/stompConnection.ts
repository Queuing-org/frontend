import type { IFrame } from "@stomp/stompjs";
import { createStompClient } from "./createStompClient";

type SocketListener = {
  onConnect?: (frame: IFrame) => void;
  onStompError?: (frame: IFrame) => void;
  onWebSocketClose?: (event: CloseEvent) => void;
  onWebSocketError?: (event: Event) => void;
};

const socketListeners = new Set<SocketListener>();

const client = createStompClient();

client.onConnect = (frame) => {
  console.log("STOMP connected");
  for (const listener of socketListeners) {
    listener.onConnect?.(frame);
  }
};

client.onStompError = (frame) => {
  console.error("STOMP error:", frame.headers["message"], frame.body);
  for (const listener of socketListeners) {
    listener.onStompError?.(frame);
  }
};

client.onWebSocketError = (event) => {
  console.error("WebSocket error event:", event);
  for (const listener of socketListeners) {
    listener.onWebSocketError?.(event);
  }
};

client.onWebSocketClose = (event) => {
  console.error("WebSocket closed:", {
    url: process.env.NEXT_PUBLIC_WS_URL,
    code: event.code,
    reason: event.reason,
    wasClean: event.wasClean,
  });
  for (const listener of socketListeners) {
    listener.onWebSocketClose?.(event);
  }
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

export function addSocketListener(listener: SocketListener) {
  socketListeners.add(listener);

  return () => {
    socketListeners.delete(listener);
  };
}
