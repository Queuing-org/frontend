import type { JoinRoomResult } from "@/src/features/room/api/joinRoom";
import type {
  ChatMessage,
  ChatMessageEventData,
} from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import { CHAT_MESSAGE_WINDOW_SIZE } from "../constants/chat";

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
  const hasValidSenderSlug =
    candidate.senderSlug === null || typeof candidate.senderSlug === "string";

  return (
    hasValidMessageId &&
    hasValidMessageKey &&
    hasStableMessageIdentity &&
    typeof candidate.messageType === "string" &&
    typeof candidate.content === "string" &&
    hasValidSenderSlug &&
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

export function getChatMessageIdentityKeys(message: ChatMessage) {
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

export type ChatMessageIdentityIndex = Map<string, ChatMessage>;

export function createChatMessageIdentityIndex(
  messages: readonly ChatMessage[],
): ChatMessageIdentityIndex {
  const index: ChatMessageIdentityIndex = new Map();

  messages.forEach((message) => {
    getChatMessageIdentityKeys(message).forEach((key) => index.set(key, message));
  });

  return index;
}

export function hasIndexedChatMessage(
  index: ChatMessageIdentityIndex,
  message: ChatMessage,
) {
  return getChatMessageIdentityKeys(message).some((key) => index.has(key));
}

export function appendUniqueChatMessage(
  messages: readonly ChatMessage[],
  message: ChatMessage,
  index: ChatMessageIdentityIndex,
  maxMessages: number,
) {
  const existingMessage = getChatMessageIdentityKeys(message)
    .map((key) => index.get(key))
    .find((candidate): candidate is ChatMessage => Boolean(candidate));

  if (existingMessage) {
    const existingIndex = messages.indexOf(existingMessage);
    if (existingIndex < 0) {
      getChatMessageIdentityKeys(existingMessage).forEach((key) =>
        index.delete(key),
      );
      return appendUniqueChatMessage(messages, message, index, maxMessages);
    }

    const mergedMessage = mergeChatMessageData(existingMessage, message);
    const nextMessages = messages.slice();
    nextMessages[existingIndex] = mergedMessage;
    const identityAliases = new Set([
      ...getChatMessageIdentityKeys(existingMessage),
      ...getChatMessageIdentityKeys(mergedMessage),
    ]);
    identityAliases.forEach((key) => index.set(key, mergedMessage));
    return nextMessages;
  }

  const nextMessages = [...messages, message];
  const overflowCount = Math.max(0, nextMessages.length - maxMessages);
  const removedMessages = nextMessages.splice(0, overflowCount);

  removedMessages.forEach((removedMessage) => {
    getChatMessageIdentityKeys(removedMessage).forEach((key) => {
      if (index.get(key) === removedMessage) {
        index.delete(key);
      }
    });
  });
  getChatMessageIdentityKeys(message).forEach((key) => index.set(key, message));

  return nextMessages;
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

  return Boolean(message.senderSlug && message.senderSlug === user.slug);
}

export type ChatMessageManagementAction =
  | "follow"
  | "report"
  | "block"
  | "kick"
  | "transfer";

type ChatMessageManagementOptions = {
  canKick?: boolean;
  canTransfer?: boolean;
};

const BLOCKED_CHAT_MESSAGE_CONTENT = "차단된 사용자의 채팅입니다";
export const DELETED_CHAT_MESSAGE_CONTENT = "삭제된 채팅입니다.";

export function applyChatMessageTombstones(
  messages: readonly ChatMessage[],
  tombstones: ReadonlyMap<string, string>,
) {
  return messages.map((message) => {
    const messageKey = message.messageKey?.trim();
    const deletedContent = messageKey ? tombstones.get(messageKey) : undefined;
    if (deletedContent !== undefined) {
      return { ...message, content: deletedContent, isDeleted: true };
    }
    return message.content === DELETED_CHAT_MESSAGE_CONTENT
      ? { ...message, isDeleted: true }
      : message;
  });
}

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

export function getVisibleChatMessageWindow(
  messages: readonly ChatMessage[],
  blockedSenderSlugs: ReadonlySet<string>,
) {
  const visibleMessages: ChatMessage[] = [];

  for (
    let index = messages.length - 1;
    index >= 0 && visibleMessages.length < CHAT_MESSAGE_WINDOW_SIZE;
    index -= 1
  ) {
    const message = messages[index];
    if (shouldDisplayChatMessage(message, blockedSenderSlugs)) {
      visibleMessages.push(message);
    }
  }

  visibleMessages.reverse();
  return visibleMessages;
}

export function getChatMessageManagementActions(
  message: ChatMessage,
  currentUser: User | null,
  { canKick = false, canTransfer = false }: ChatMessageManagementOptions = {},
): ChatMessageManagementAction[] {
  if (message.isDeleted || !currentUser || isChatMessageFromUser(message, currentUser)) {
    return [];
  }

  const actions: ChatMessageManagementAction[] = [];
  if (message.senderSlug?.trim()) {
    actions.push("follow");
  }
  if (message.messageKey?.trim()) {
    actions.push("report");
  }
  if (message.senderSlug?.trim()) {
    actions.push("block");
  }
  if (canKick && message.senderSlug?.trim()) {
    actions.push("kick");
  }
  if (canTransfer && message.senderSlug?.trim()) {
    actions.push("transfer");
  }

  return actions;
}

export function getLatestReportableChatMessageKey(
  messages: readonly ChatMessage[],
  userSlug: string | null | undefined,
) {
  const normalizedUserSlug = userSlug?.trim();
  if (!normalizedUserSlug) {
    return null;
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const messageKey = message.messageKey?.trim();
    if (!message.isDeleted && message.senderSlug === normalizedUserSlug && messageKey) {
      return messageKey;
    }
  }

  return null;
}
