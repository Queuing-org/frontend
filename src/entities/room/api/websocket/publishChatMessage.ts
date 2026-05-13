import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export type PublishChatMessagePayload = {
  content: string;
  messageType?: "TEXT";
};

export function publishChatMessage(
  safeSlug: string,
  payload: PublishChatMessagePayload,
) {
  const client = getSocketClient();
  const normalizedSlug = normalizeRoomSlug(safeSlug);

  client.publish({
    destination: `/app/room/${encodeURIComponent(normalizedSlug)}/chat`,
    body: JSON.stringify({
      content: payload.content.trim(),
      messageType: payload.messageType ?? "TEXT",
    }),
  });
}
