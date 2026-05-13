import type { JoinRoomResult } from "@/src/entities/room/api/joinRoom";
import type {
  ChatMessage,
  ChatMessageEventData,
} from "@/src/entities/room/model/types";

export function isChatMessageData(data: unknown): data is ChatMessageEventData {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as Partial<ChatMessageEventData>;

  return (
    typeof candidate.messageId === "number" &&
    typeof candidate.messageType === "string" &&
    typeof candidate.content === "string" &&
    typeof candidate.senderId === "number" &&
    typeof candidate.senderNickname === "string" &&
    (candidate.senderProfileImageUrl === null ||
      typeof candidate.senderProfileImageUrl === "string") &&
    typeof candidate.sentAt === "number"
  );
}

export function getRecentChatMessages(
  data: JoinRoomResult["data"],
): ChatMessage[] {
  if (!Array.isArray(data?.recentChatMessages)) {
    return [];
  }

  return data.recentChatMessages.filter(isChatMessageData);
}

export function mergeUniqueChatMessages(messages: ChatMessage[]) {
  const seenMessageIds = new Set<number>();
  const uniqueMessages: ChatMessage[] = [];

  for (const message of messages) {
    if (seenMessageIds.has(message.messageId)) {
      continue;
    }

    seenMessageIds.add(message.messageId);
    uniqueMessages.push(message);
  }

  return uniqueMessages;
}

export function getOldestMessageId(messages: ChatMessage[]) {
  return messages[0]?.messageId ?? null;
}
