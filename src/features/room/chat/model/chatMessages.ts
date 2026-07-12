import type { JoinRoomResult } from "@/src/features/room/api/joinRoom";
import type {
  ChatMessage,
  ChatMessageEventData,
} from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";

export function isChatMessageData(data: unknown): data is ChatMessageEventData {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as Partial<ChatMessageEventData>;
  const hasValidMessageId =
    candidate.messageId === null || typeof candidate.messageId === "number";
  const hasValidMessageKey =
    candidate.messageKey == null || typeof candidate.messageKey === "string";
  const hasStableMessageIdentity =
    typeof candidate.messageId === "number" ||
    (typeof candidate.messageKey === "string" &&
      candidate.messageKey.trim().length > 0);
  const hasValidSenderId =
    candidate.senderId == null || typeof candidate.senderId === "number";
  const hasValidSenderSlug =
    candidate.senderSlug === null || typeof candidate.senderSlug === "string";
  const hasSenderIdentity =
    hasValidSenderSlug || typeof candidate.senderId === "number";

  return (
    hasValidMessageId &&
    hasValidMessageKey &&
    hasStableMessageIdentity &&
    typeof candidate.messageType === "string" &&
    typeof candidate.content === "string" &&
    hasValidSenderId &&
    hasSenderIdentity &&
    typeof candidate.senderNickname === "string" &&
    (candidate.senderProfileImageUrl == null ||
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

export function getChatMessageRenderKey(message: ChatMessage) {
  if (message.messageKey) {
    return `buffer:${message.messageKey}`;
  }

  if (typeof message.messageId === "number") {
    return `db:${message.messageId}`;
  }

  return `temp:${message.senderSlug ?? "unknown"}:${message.sentAt}:${
    message.content
  }`;
}

function getChatMessageIdentityKeys(message: ChatMessage) {
  const keys: string[] = [];

  if (message.messageKey) {
    keys.push(`buffer:${message.messageKey}`);
  }

  if (typeof message.messageId === "number") {
    keys.push(`db:${message.messageId}`);
  }

  if (keys.length === 0) {
    keys.push(getChatMessageRenderKey(message));
  }

  return keys;
}

function mergeChatMessageData(
  previous: ChatMessage,
  next: ChatMessage,
): ChatMessage {
  return {
    ...previous,
    ...next,
    messageId:
      typeof next.messageId === "number" ? next.messageId : previous.messageId,
    messageKey: next.messageKey ?? previous.messageKey ?? null,
    senderSlug: next.senderSlug ?? previous.senderSlug ?? null,
    senderProfileImageUrl:
      next.senderProfileImageUrl ?? previous.senderProfileImageUrl ?? null,
  };
}

export function mergeUniqueChatMessages(messages: ChatMessage[]) {
  const messageIndexByKey = new Map<string, number>();
  const uniqueMessages: ChatMessage[] = [];

  for (const message of messages) {
    const identityKeys = getChatMessageIdentityKeys(message);
    const existingMessageIndex = identityKeys
      .map((key) => messageIndexByKey.get(key))
      .find((index): index is number => typeof index === "number");

    if (typeof existingMessageIndex === "number") {
      uniqueMessages[existingMessageIndex] = mergeChatMessageData(
        uniqueMessages[existingMessageIndex],
        message,
      );

      for (const key of getChatMessageIdentityKeys(
        uniqueMessages[existingMessageIndex],
      )) {
        messageIndexByKey.set(key, existingMessageIndex);
      }

      continue;
    }

    const nextIndex = uniqueMessages.length;
    for (const key of identityKeys) {
      messageIndexByKey.set(key, nextIndex);
    }
    uniqueMessages.push(message);
  }

  return uniqueMessages;
}

export function getOldestMessageId(messages: ChatMessage[]) {
  return (
    messages.find((message) => typeof message.messageId === "number")
      ?.messageId ?? null
  );
}

export function isChatMessageFromUser(
  message: ChatMessage,
  user: User | null,
) {
  if (!user) {
    return false;
  }

  let hasStableIdentity = false;

  if (message.senderSlug && user.slug) {
    hasStableIdentity = true;

    if (message.senderSlug === user.slug) {
      return true;
    }
  }

  if (message.senderId != null && user.userId != null) {
    hasStableIdentity = true;

    if (message.senderId === user.userId) {
      return true;
    }
  }

  if (hasStableIdentity) {
    return false;
  }

  return message.senderNickname === user.nickname;
}

export type ChatMessageManagementAction = "block" | "report";

const BLOCKED_CHAT_MESSAGE_CONTENT = "차단된 사용자의 채팅입니다";

export function shouldDisplayChatMessage(
  message: ChatMessage,
  blockedSenderSlugs: ReadonlySet<string>,
) {
  const normalizedContent = message.content.trim().replace(/\.$/, "");

  if (normalizedContent === BLOCKED_CHAT_MESSAGE_CONTENT) {
    return false;
  }

  return !message.senderSlug || !blockedSenderSlugs.has(message.senderSlug);
}

export function getChatMessageManagementActions(
  message: ChatMessage,
  currentUser: User | null,
): ChatMessageManagementAction[] {
  if (!currentUser || isChatMessageFromUser(message, currentUser)) {
    return [];
  }

  const actions: ChatMessageManagementAction[] = [];
  if (message.messageKey?.trim()) {
    actions.push("report");
  }
  if (message.senderSlug?.trim()) {
    actions.push("block");
  }

  return actions;
}
