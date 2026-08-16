import type {
  ChatMessage,
  ChatMessageDeletedData,
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

export function getVisibleChatSendErrorMessage(error: WsErrorData) {
  if (error.code.trim().toLowerCase() === "invalid-input") {
    return undefined;
  }

  return error.message.trim() || "채팅을 전송하지 못했습니다.";
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

export function parseChatMessageDeletedEvent(
  body: string,
  roomSlug: string,
): ChatMessageDeletedData | null {
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(body);
  } catch {
    return null;
  }
  if (!parsedBody || typeof parsedBody !== "object") {
    return null;
  }
  const event = parsedBody as Partial<WsEvent>;
  const normalizedRoomSlug = normalizeRoomSlug(roomSlug);
  const eventRoomSlug = typeof event.roomSlug === "string"
    ? normalizeRoomSlug(event.roomSlug)
    : normalizedRoomSlug;
  if (eventRoomSlug !== normalizedRoomSlug || event.type !== "CHAT_MESSAGE_DELETED") {
    return null;
  }
  const data = event.data as Partial<ChatMessageDeletedData> | undefined;
  return data && typeof data.messageKey === "string" && data.messageKey.trim() &&
    typeof data.content === "string" && typeof data.deletedAt === "number"
    ? data as ChatMessageDeletedData
    : null;
}
