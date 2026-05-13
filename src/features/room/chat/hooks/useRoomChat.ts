"use client";

import { useCallback } from "react";
import type { User } from "@/src/entities/user/model/types";
import { useRoomChatHistory } from "./useRoomChatHistory";
import { useRoomChatRealtime } from "./useRoomChatRealtime";

type UseRoomChatParams = {
  currentUser: User | null;
  isEnabled: boolean;
  slug: string;
};

export function useRoomChat({
  currentUser,
  isEnabled,
  slug,
}: UseRoomChatParams) {
  const {
    appendMessage,
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
