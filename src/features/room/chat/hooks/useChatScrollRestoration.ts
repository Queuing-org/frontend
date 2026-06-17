"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

const LOAD_OLDER_THRESHOLD_PX = 72;
const STICKY_BOTTOM_THRESHOLD_PX = 96;

type UseChatScrollRestorationParams = {
  hasOlderMessages: boolean;
  isLoadingOlderMessages: boolean;
  messageCount: number;
  onLoadOlderMessages: () => void;
  scrollToLatestKey: number;
};

export function useChatScrollRestoration({
  hasOlderMessages,
  isLoadingOlderMessages,
  messageCount,
  onLoadOlderMessages,
  scrollToLatestKey,
}: UseChatScrollRestorationParams) {
  const listRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const restoreScrollRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);

  const requestOlderMessages = useCallback(() => {
    const list = listRef.current;
    if (!list || !hasOlderMessages || isLoadingOlderMessages) {
      return;
    }

    restoreScrollRef.current = {
      scrollHeight: list.scrollHeight,
      scrollTop: list.scrollTop,
    };
    onLoadOlderMessages();
  }, [hasOlderMessages, isLoadingOlderMessages, onLoadOlderMessages]);

  const handleScroll = useCallback(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    const distanceFromBottom =
      list.scrollHeight - list.scrollTop - list.clientHeight;
    shouldStickToBottomRef.current =
      distanceFromBottom < STICKY_BOTTOM_THRESHOLD_PX;

    if (list.scrollTop < LOAD_OLDER_THRESHOLD_PX) {
      requestOlderMessages();
    }
  }, [requestOlderMessages]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    if (restoreScrollRef.current && !isLoadingOlderMessages) {
      const { scrollHeight, scrollTop } = restoreScrollRef.current;
      list.scrollTop = list.scrollHeight - scrollHeight + scrollTop;
      restoreScrollRef.current = null;
      return;
    }

    if (shouldStickToBottomRef.current) {
      list.scrollTop = list.scrollHeight;
    }
  }, [isLoadingOlderMessages, messageCount]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    restoreScrollRef.current = null;
    shouldStickToBottomRef.current = true;
    list.scrollTop = list.scrollHeight;
  }, [scrollToLatestKey]);

  return {
    handleScroll,
    listRef,
    requestOlderMessages,
  };
}
