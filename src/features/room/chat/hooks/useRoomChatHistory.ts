"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomChats } from "@/src/features/room/hooks/useRoomChats";
import type { JoinRoomResult } from "@/src/features/room/api/joinRoom";
import type { ChatMessage } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import { ApiError } from "@/src/shared/api/api-error";
import {
  getChatMessageRenderKey,
  getOldestMessageId,
  getRecentChatMessages,
  isChatMessageFromUser,
  isChatMessageData,
  mergeUniqueChatMessages,
} from "../model/chatMessages";

type UseRoomChatHistoryParams = {
  currentUser: User | null;
  isEnabled: boolean;
  roomPassword?: string | null;
  slug: string;
};

const CHAT_HISTORY_PAGE_SIZE = 100;

export function useRoomChatHistory({
  currentUser,
  isEnabled,
  roomPassword,
  slug,
}: UseRoomChatHistoryParams) {
  const initialChatHistorySlugRef = useRef<string | null>(null);
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

  const reset = useCallback(() => {
    initialChatHistorySlugRef.current = null;
    setChatMessages([]);
    setChatHistoryCursor(null);
    setHasOlderChatMessages(false);
    setChatHistoryErrorMessage("");
    setIsInitializingChatHistory(false);
  }, []);

  const initializeFromMessages = useCallback((messages: ChatMessage[]) => {
    const recentMessages = mergeUniqueChatMessages(messages);

    setChatMessages(recentMessages);
    setChatHistoryCursor(getOldestMessageId(recentMessages));
    setHasOlderChatMessages(recentMessages.length > 0);
    setChatHistoryErrorMessage("");
    setChatScrollToLatestKey((currentKey) => currentKey + 1);
    setIsInitializingChatHistory(false);
  }, []);

  const initializeFromJoinData = useCallback(
    (data: JoinRoomResult["data"]) => {
      initializeFromMessages(getRecentChatMessages(data));
    },
    [initializeFromMessages],
  );

  const appendMessage = useCallback((message: ChatMessage) => {
    setChatMessages((currentMessages) =>
      mergeUniqueChatMessages([...currentMessages, message]),
    );
  }, []);

  const loadInitialChatHistory = useCallback(() => {
    if (!slug) {
      return;
    }

    if (chatMessages.length > 0) {
      return;
    }

    setIsInitializingChatHistory(true);
    setChatHistoryErrorMessage("");

    void (async () => {
      try {
        const result = await loadRoomChats({
          password: roomPassword,
          size: CHAT_HISTORY_PAGE_SIZE,
          slug,
        });
        const pageMessages = result.items.filter(isChatMessageData).reverse();

        setChatMessages((currentMessages) =>
          mergeUniqueChatMessages([...pageMessages, ...currentMessages]),
        );
        setChatHistoryCursor(result.nextCursor);
        setHasOlderChatMessages(
          result.hasNext && typeof result.nextCursor === "number",
        );
        setChatScrollToLatestKey((currentKey) => currentKey + 1);
      } catch (error) {
        const err = error as ApiError;
        setChatHistoryErrorMessage(
          err.message || "채팅 기록을 불러오지 못했습니다.",
        );
      } finally {
        setIsInitializingChatHistory(false);
      }
    })();
  }, [chatMessages.length, loadRoomChats, roomPassword, slug]);

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

    setChatHistoryErrorMessage("");

    void (async () => {
      try {
        const result = await loadRoomChats({
          cursorId: chatHistoryCursor,
          password: roomPassword,
          size: CHAT_HISTORY_PAGE_SIZE,
          slug,
        });
        const olderMessages = result.items
          .filter(isChatMessageData)
          .reverse();

        setChatMessages((currentMessages) =>
          mergeUniqueChatMessages([...olderMessages, ...currentMessages]),
        );
        setChatHistoryCursor(result.nextCursor);
        setHasOlderChatMessages(
          result.hasNext && typeof result.nextCursor === "number",
        );
      } catch (error) {
        const err = error as ApiError;
        setChatHistoryErrorMessage(
          err.message || "이전 채팅을 불러오지 못했습니다.",
        );
      }
    })();
  }, [
    chatHistoryCursor,
    hasOlderChatMessages,
    isEnabled,
    isInitializingChatHistory,
    isLoadingOlderChatMessages,
    loadRoomChats,
    roomPassword,
    slug,
  ]);

  const backfillLatestMessage = useCallback(
    async (expectedContent: string) => {
      if (!slug || !currentUser) {
        return false;
      }

      try {
        const result = await backfillRoomChats({
          password: roomPassword,
          size: CHAT_HISTORY_PAGE_SIZE,
          slug,
        });
        const latestMessages = result.items
          .filter(isChatMessageData)
          .reverse();
        const currentMessageKeys = new Set(
          chatMessages.map(getChatMessageRenderKey),
        );
        const foundExpectedMessage = latestMessages.some(
          (message) =>
            !currentMessageKeys.has(getChatMessageRenderKey(message)) &&
            message.content === expectedContent &&
            isChatMessageFromUser(message, currentUser),
        );

        setChatMessages((currentMessages) =>
          mergeUniqueChatMessages([...currentMessages, ...latestMessages]),
        );

        if (chatMessages.length === 0) {
          setChatHistoryCursor(result.nextCursor);
          setHasOlderChatMessages(
            result.hasNext && typeof result.nextCursor === "number",
          );
        }

        if (foundExpectedMessage) {
          setChatHistoryErrorMessage("");
          setChatScrollToLatestKey((currentKey) => currentKey + 1);
        }

        return foundExpectedMessage;
      } catch {
        return false;
      }
    },
    [backfillRoomChats, chatMessages, currentUser, roomPassword, slug],
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

  return {
    appendMessage,
    backfillLatestMessage,
    hasOlderMessages: hasOlderChatMessages,
    historyErrorMessage: chatHistoryErrorMessage,
    initializeFromJoinData,
    isLoadingOlderMessages:
      isLoadingOlderChatMessages || isInitializingChatHistory,
    loadOlderMessages,
    messages: chatMessages,
    reset,
    scrollToLatestKey: chatScrollToLatestKey,
  };
}
