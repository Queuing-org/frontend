const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const configuredWebSocketUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();

export const API_BASE_URL =
  configuredApiBaseUrl || "https://api.queuing.cc";
export const WEB_SOCKET_URL =
  configuredWebSocketUrl || "wss://api.queuing.cc/ws";
