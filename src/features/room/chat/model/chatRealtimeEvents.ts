import type {
  ChatMessage,
  WsErrorData,
  WsEvent,
} from "@/src/features/room/model/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import { isChatMessageData } from "./chatMessages";

export function isWsErrorData(data: unknown): data is WsErrorData {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as Partial<WsErrorData>;

  return (
    typeof candidate.statusCode === "number" &&
    typeof candidate.code === "string" &&
    typeof candidate.message === "string"
  );
}

export function parseChatMessageEvent(
  body: string,
  roomSlug: string,
): ChatMessage | null {
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(body);
  } catch {
    return null;
  }

  if (isChatMessageData(parsedBody)) {
    return parsedBody;
  }

  if (!parsedBody || typeof parsedBody !== "object") {
    return null;
  }

  const event = parsedBody as Partial<WsEvent>;
  const normalizedRoomSlug = normalizeRoomSlug(roomSlug);
  const eventRoomSlug =
    typeof event.roomSlug === "string"
      ? normalizeRoomSlug(event.roomSlug)
      : normalizedRoomSlug;

  if (
    eventRoomSlug !== normalizedRoomSlug ||
    event.type !== "CHAT_MESSAGE" ||
    !isChatMessageData(event.data)
  ) {
    return null;
  }

  return event.data;
}
