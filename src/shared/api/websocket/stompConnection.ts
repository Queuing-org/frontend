import type { IFrame } from "@stomp/stompjs";
import {
  createStompClient,
  DEFAULT_STOMP_RECONNECT_DELAY_MS,
} from "./createStompClient";

type SocketListener = {
  onConnect?: (frame: IFrame) => void;
  onStompError?: (frame: IFrame) => void;
  onWebSocketClose?: (event: CloseEvent) => void;
  onWebSocketError?: (event: Event) => void;
};

const socketListeners = new Set<SocketListener>();
const SOCKET_DISCONNECT_IDLE_MS = 1_000;
let socketSessionCount = 0;
let disconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;

const client = createStompClient();

client.onConnect = (frame) => {
  for (const listener of socketListeners) {
    listener.onConnect?.(frame);
  }
};

client.onStompError = (frame) => {
  console.error("STOMP broker error", {
    message: frame.headers["message"] ?? "Unknown broker error",
  });
  for (const listener of socketListeners) {
    listener.onStompError?.(frame);
  }
};

client.onWebSocketError = (event) => {
  console.error("WebSocket transport error");
  for (const listener of socketListeners) {
    listener.onWebSocketError?.(event);
  }
};

client.onWebSocketClose = (event) => {
  if (!event.wasClean) {
    console.error("WebSocket closed unexpectedly", {
      code: event.code,
      wasClean: event.wasClean,
    });
  }
  for (const listener of socketListeners) {
    listener.onWebSocketClose?.(event);
  }
};

export function connectSocket() {
  client.reconnectDelay = DEFAULT_STOMP_RECONNECT_DELAY_MS;
  client.activate();
}

export function disconnectSocket() {
  void client.deactivate();
}

export function acquireSocketSession() {
  if (disconnectTimeoutId !== null) {
    clearTimeout(disconnectTimeoutId);
    disconnectTimeoutId = null;
  }
  socketSessionCount += 1;
  let released = false;

  return () => {
    if (released) {
      return;
    }

    released = true;
    socketSessionCount = Math.max(0, socketSessionCount - 1);
    if (socketSessionCount > 0 || disconnectTimeoutId !== null) {
      return;
    }

    disconnectTimeoutId = setTimeout(() => {
      disconnectTimeoutId = null;
      if (socketSessionCount === 0) {
        disconnectSocket();
      }
    }, SOCKET_DISCONNECT_IDLE_MS);
  };
}

export function stopSocketAutoReconnect() {
  client.reconnectDelay = 0;
  void client.deactivate();
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
