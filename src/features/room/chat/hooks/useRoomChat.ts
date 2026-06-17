"use client";

import { useCallback } from "react";
import type { User } from "@/src/features/user/model/types";
import { useRoomChatHistory } from "./useRoomChatHistory";
import { useRoomChatRealtime } from "./useRoomChatRealtime";

type UseRoomChatParams = {
  currentUser: User | null;
  isEnabled: boolean;
  roomPassword?: string | null;
  slug: string;
};

export function useRoomChat({
  currentUser,
  isEnabled,
  roomPassword,
  slug,
}: UseRoomChatParams) {
  const {
    appendMessage,
    backfillLatestMessage,
    hasOlderMessages,
    historyErrorMessage,
    initializeFromJoinData,
    isLoadingOlderMessages,
    loadOlderMessages,
    messages,
    reset: resetHistory,
    scrollToLatestKey,
  } = useRoomChatHistory({
    currentUser,
    isEnabled,
    roomPassword,
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
    onPendingMessageBackfill: backfillLatestMessage,
    roomPassword,
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
