"use client";

import { useCallback } from "react";
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
    onMessageDeleted: ({ messageKey, content }) =>
      markMessageDeleted(messageKey, content),
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
