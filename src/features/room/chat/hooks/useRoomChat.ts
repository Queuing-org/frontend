"use client";

import { useCallback } from "react";
import type { ChatMessageDeletedData } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import { useRoomChatHistory } from "./useRoomChatHistory";
import { useRoomChatRealtime } from "./useRoomChatRealtime";

type UseRoomChatParams = {
  currentUser: User | null;
  isEnabled: boolean;
  roomAccessToken: string | null;
  slug: string;
};

export function useRoomChat({
  currentUser,
  isEnabled,
  roomAccessToken,
  slug,
}: UseRoomChatParams) {
  const {
    appendMessage,
    backfillLatestMessages,
    hasOlderMessages,
    historyErrorMessage,
    initializeFromJoinData,
    isLoadingOlderMessages,
    loadOlderMessages,
    markMessageDeleted,
    messages,
    reset: resetHistory,
    scrollToLatestKey,
  } = useRoomChatHistory({
    currentUser,
    isEnabled,
    roomAccessToken,
    slug,
  });
  const handleMessageDeleted = useCallback(
    ({ messageKey, content }: ChatMessageDeletedData) => {
      markMessageDeleted(messageKey, content);
    },
    [markMessageDeleted],
  );
  const {
    cleanupSubscriptions,
    isSending,
    reset: resetRealtime,
    sendErrorMessage,
    sendMessage,
  } = useRoomChatRealtime({
    currentUser,
    isEnabled,
    onMessage: appendMessage,
    onMessageDeleted: handleMessageDeleted,
    onPendingMessageBackfill: backfillLatestMessages,
    roomAccessToken,
    slug,
  });

  const reset = useCallback(() => {
    resetHistory();
    resetRealtime();
  }, [resetHistory, resetRealtime]);

  return {
    cleanupSubscriptions,
    hasOlderMessages,
    historyErrorMessage,
    initializeFromJoinData,
    isLoadingOlderMessages,
    isSending,
    loadOlderMessages,
    messages,
    reset,
    scrollToLatestKey,
    sendErrorMessage,
    sendMessage,
  };
}
