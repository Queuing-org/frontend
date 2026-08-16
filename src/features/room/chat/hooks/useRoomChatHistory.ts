"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { JoinRoomResult } from "@/src/features/room/api/joinRoom";
import { useRoomChats } from "@/src/features/room/hooks/useRoomChats";
import type { ChatMessage } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import { ApiError } from "@/src/shared/api/api-error";
import { CHAT_MESSAGE_WINDOW_SIZE } from "../constants/chat";
import {
  appendUniqueChatMessage,
  applyChatMessageTombstones,
  type ChatMessageIdentityIndex,
  createChatMessageIdentityIndex,
  getChatMessageIdentityKeys,
  getOldestMessageId,
  getRecentChatMessages,
  hasIndexedChatMessage,
  isChatMessageData,
  isChatMessageFromUser,
  mergeUniqueChatMessages,
} from "../model/chatMessages";

type UseRoomChatHistoryParams = {
  currentUser: User | null;
  isEnabled: boolean;
  roomPassword?: string | null;
  slug: string;
};

const CHAT_HISTORY_PAGE_SIZE = 100;

function selectPendingBackfillMessages({
  currentMessageIndex,
  currentUser,
  expectedContents,
  latestMessages,
}: {
  currentMessageIndex: ChatMessageIdentityIndex;
  currentUser: User;
  expectedContents: readonly string[];
  latestMessages: readonly ChatMessage[];
}) {
  const remainingExpectedCounts = new Map<string, number>();
  expectedContents.forEach((content) =>
    remainingExpectedCounts.set(
      content,
      (remainingExpectedCounts.get(content) ?? 0) + 1,
    ),
  );
  const seenMessages = new Map(currentMessageIndex);
  const selectedMessages: ChatMessage[] = [];

  for (let index = latestMessages.length - 1; index >= 0; index -= 1) {
    const message = latestMessages[index];
    const remainingExpectedCount =
      remainingExpectedCounts.get(message.content) ?? 0;

    if (
      remainingExpectedCount <= 0 ||
      hasIndexedChatMessage(seenMessages, message) ||
      !isChatMessageFromUser(message, currentUser)
    ) {
      continue;
    }

    selectedMessages.push(message);
    remainingExpectedCounts.set(
      message.content,
      remainingExpectedCount - 1,
    );
    getChatMessageIdentityKeys(message).forEach((key) =>
      seenMessages.set(key, message),
    );
  }

  selectedMessages.reverse();
  return selectedMessages;
}

export function useRoomChatHistory({
  currentUser,
  isEnabled,
  roomPassword,
  slug,
}: UseRoomChatHistoryParams) {
  const initialChatHistorySlugRef = useRef<string | null>(null);
  const chatMessagesRef = useRef<ChatMessage[]>([]);
  const chatMessageIndexRef = useRef(createChatMessageIdentityIndex([]));
  const deletedMessageTombstonesRef = useRef(new Map<string, string>());
  const historyAbortControllerRef = useRef<AbortController | null>(null);
  const backfillAbortControllerRef = useRef<AbortController | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatHistoryCursor, setChatHistoryCursor] = useState<number | null>(
    null,
  );
  const [hasOlderChatMessages, setHasOlderChatMessages] = useState(false);
  const [chatHistoryErrorMessage, setChatHistoryErrorMessage] = useState("");
  const [chatScrollToLatestKey, setChatScrollToLatestKey] = useState(0);
  const [isInitializingChatHistory, setIsInitializingChatHistory] =
    useState(false);
  const {
    mutateAsync: loadRoomChats,
    isPending: isLoadingOlderChatMessages,
  } = useRoomChats();
  const { mutateAsync: backfillRoomChats } = useRoomChats();

  const replaceChatMessages = useCallback((messages: ChatMessage[]) => {
    const tombstonedMessages = applyChatMessageTombstones(
      messages,
      deletedMessageTombstonesRef.current,
    );
    const nextMessages =
      tombstonedMessages.length > CHAT_MESSAGE_WINDOW_SIZE
        ? tombstonedMessages.slice(-CHAT_MESSAGE_WINDOW_SIZE)
        : tombstonedMessages;

    chatMessagesRef.current = nextMessages;
    chatMessageIndexRef.current = createChatMessageIdentityIndex(nextMessages);
    setChatMessages(nextMessages);
    return nextMessages;
  }, []);

  const mergeChatMessages = useCallback(
    (messages: ChatMessage[], position: "before" | "after") => {
      const currentMessages = chatMessagesRef.current;
      const mergedMessages = mergeUniqueChatMessages(
        position === "before"
          ? [...messages, ...currentMessages]
          : [...currentMessages, ...messages],
      );

      return replaceChatMessages(mergedMessages);
    },
    [replaceChatMessages],
  );

  const abortRequests = useCallback(() => {
    historyAbortControllerRef.current?.abort();
    historyAbortControllerRef.current = null;
    backfillAbortControllerRef.current?.abort();
    backfillAbortControllerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    abortRequests();
    initialChatHistorySlugRef.current = null;
    deletedMessageTombstonesRef.current.clear();
    replaceChatMessages([]);
    setChatHistoryCursor(null);
    setHasOlderChatMessages(false);
    setChatHistoryErrorMessage("");
    setIsInitializingChatHistory(false);
  }, [abortRequests, replaceChatMessages]);

  const initializeFromMessages = useCallback(
    (messages: ChatMessage[]) => {
      const recentMessages = replaceChatMessages(
        mergeUniqueChatMessages(messages),
      );

      setChatHistoryCursor(getOldestMessageId(recentMessages));
      setHasOlderChatMessages(
        recentMessages.length > 0 &&
          recentMessages.length < CHAT_MESSAGE_WINDOW_SIZE,
      );
      setChatHistoryErrorMessage("");
      setChatScrollToLatestKey((currentKey) => currentKey + 1);
      setIsInitializingChatHistory(false);
    },
    [replaceChatMessages],
  );

  const initializeFromJoinData = useCallback(
    (data: JoinRoomResult["data"]) => {
      initializeFromMessages(getRecentChatMessages(data));
    },
    [initializeFromMessages],
  );

  const appendMessage = useCallback((message: ChatMessage) => {
    const [nextMessage] = applyChatMessageTombstones(
      [message],
      deletedMessageTombstonesRef.current,
    );
    const nextMessages = appendUniqueChatMessage(
      chatMessagesRef.current,
      nextMessage,
      chatMessageIndexRef.current,
      CHAT_MESSAGE_WINDOW_SIZE,
    );
    chatMessagesRef.current = nextMessages;
    setChatMessages(nextMessages);
  }, []);

  const markMessageDeleted = useCallback((messageKey: string, content: string) => {
    deletedMessageTombstonesRef.current.set(messageKey, content);
    replaceChatMessages(chatMessagesRef.current);
  }, [replaceChatMessages]);

  const loadInitialChatHistory = useCallback(() => {
    if (!slug || chatMessagesRef.current.length > 0) {
      return;
    }

    historyAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    historyAbortControllerRef.current = abortController;
    setIsInitializingChatHistory(true);
    setChatHistoryErrorMessage("");

    void (async () => {
      try {
        const result = await loadRoomChats({
          password: roomPassword,
          signal: abortController.signal,
          size: CHAT_HISTORY_PAGE_SIZE,
          slug,
        });
        if (abortController.signal.aborted) {
          return;
        }

        const pageMessages = result.items.filter(isChatMessageData).reverse();
        const nextMessages = mergeChatMessages(pageMessages, "before");
        setChatHistoryCursor(result.nextCursor);
        setHasOlderChatMessages(
          result.hasNext &&
            typeof result.nextCursor === "number" &&
            nextMessages.length < CHAT_MESSAGE_WINDOW_SIZE,
        );
        setChatScrollToLatestKey((currentKey) => currentKey + 1);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        const err = error as ApiError;
        setChatHistoryErrorMessage(
          err.message || "채팅 기록을 불러오지 못했습니다.",
        );
      } finally {
        if (historyAbortControllerRef.current === abortController) {
          historyAbortControllerRef.current = null;
          setIsInitializingChatHistory(false);
        }
      }
    })();
  }, [loadRoomChats, mergeChatMessages, roomPassword, slug]);

  const loadOlderMessages = useCallback(() => {
    if (
      !slug ||
      !isEnabled ||
      !hasOlderChatMessages ||
      isLoadingOlderChatMessages ||
      isInitializingChatHistory
    ) {
      return;
    }

    if (typeof chatHistoryCursor !== "number") {
      setHasOlderChatMessages(false);
      return;
    }

    const remainingCapacity =
      CHAT_MESSAGE_WINDOW_SIZE - chatMessagesRef.current.length;
    if (remainingCapacity <= 0) {
      setHasOlderChatMessages(false);
      return;
    }

    historyAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    historyAbortControllerRef.current = abortController;
    setChatHistoryErrorMessage("");

    void (async () => {
      try {
        const result = await loadRoomChats({
          cursorId: chatHistoryCursor,
          password: roomPassword,
          signal: abortController.signal,
          size: Math.min(CHAT_HISTORY_PAGE_SIZE, remainingCapacity),
          slug,
        });
        if (abortController.signal.aborted) {
          return;
        }

        const olderMessages = result.items
          .filter(isChatMessageData)
          .reverse();
        const nextMessages = mergeChatMessages(olderMessages, "before");
        setChatHistoryCursor(result.nextCursor);
        setHasOlderChatMessages(
          result.hasNext &&
            typeof result.nextCursor === "number" &&
            nextMessages.length < CHAT_MESSAGE_WINDOW_SIZE,
        );
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        const err = error as ApiError;
        setChatHistoryErrorMessage(
          err.message || "이전 채팅을 불러오지 못했습니다.",
        );
      } finally {
        if (historyAbortControllerRef.current === abortController) {
          historyAbortControllerRef.current = null;
        }
      }
    })();
  }, [
    chatHistoryCursor,
    hasOlderChatMessages,
    isEnabled,
    isInitializingChatHistory,
    isLoadingOlderChatMessages,
    loadRoomChats,
    mergeChatMessages,
    roomPassword,
    slug,
  ]);

  const backfillLatestMessages = useCallback(
    async (expectedContents: readonly string[]) => {
      if (!slug || !currentUser || expectedContents.length === 0) {
        return [];
      }

      backfillAbortControllerRef.current?.abort();
      const abortController = new AbortController();
      backfillAbortControllerRef.current = abortController;

      try {
        const result = await backfillRoomChats({
          password: roomPassword,
          signal: abortController.signal,
          size: CHAT_HISTORY_PAGE_SIZE,
          slug,
        });
        if (abortController.signal.aborted) {
          return [];
        }

        const latestMessages = result.items
          .filter(isChatMessageData)
          .reverse();
        const wasEmpty = chatMessagesRef.current.length === 0;
        const pendingBackfillMessages = selectPendingBackfillMessages({
          currentMessageIndex: chatMessageIndexRef.current,
          currentUser,
          expectedContents,
          latestMessages,
        });
        const foundContents = pendingBackfillMessages.map(
          (message) => message.content,
        );
        let nextMessages = chatMessagesRef.current;

        if (wasEmpty) {
          nextMessages = replaceChatMessages(
            mergeUniqueChatMessages(latestMessages),
          );
          setChatHistoryCursor(result.nextCursor);
          setHasOlderChatMessages(
            result.hasNext &&
              typeof result.nextCursor === "number" &&
              nextMessages.length < CHAT_MESSAGE_WINDOW_SIZE,
          );
        } else if (pendingBackfillMessages.length > 0) {
          pendingBackfillMessages.forEach((message) => {
            nextMessages = appendUniqueChatMessage(
              nextMessages,
              message,
              chatMessageIndexRef.current,
              CHAT_MESSAGE_WINDOW_SIZE,
            );
          });
          chatMessagesRef.current = nextMessages;
          setChatMessages(nextMessages);
        }

        if (foundContents.length > 0) {
          setChatHistoryErrorMessage("");
          setChatScrollToLatestKey((currentKey) => currentKey + 1);
        }

        return foundContents;
      } catch {
        return [];
      } finally {
        if (backfillAbortControllerRef.current === abortController) {
          backfillAbortControllerRef.current = null;
        }
      }
    },
    [backfillRoomChats, currentUser, replaceChatMessages, roomPassword, slug],
  );

  useEffect(() => {
    const historyKey = `${slug}:${roomPassword ?? ""}`;

    if (
      !isEnabled ||
      !slug ||
      initialChatHistorySlugRef.current === historyKey
    ) {
      return;
    }

    initialChatHistorySlugRef.current = historyKey;
    loadInitialChatHistory();
  }, [isEnabled, loadInitialChatHistory, roomPassword, slug]);

  useEffect(() => abortRequests, [abortRequests]);

  return {
    appendMessage,
    backfillLatestMessages,
    hasOlderMessages: hasOlderChatMessages,
    historyErrorMessage: chatHistoryErrorMessage,
    initializeFromJoinData,
    isLoadingOlderMessages:
      isLoadingOlderChatMessages || isInitializingChatHistory,
    loadOlderMessages,
    markMessageDeleted,
    messages: chatMessages,
    reset,
    scrollToLatestKey: chatScrollToLatestKey,
  };
}
