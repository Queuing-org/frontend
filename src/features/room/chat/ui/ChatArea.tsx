"use client";

import Image from "next/image";
import { useCallback, useLayoutEffect, useRef } from "react";
import type { ChatMessage } from "@/src/entities/room/model/types";
import { getChatMessageRenderKey } from "../model/chatMessages";
import styles from "./ChatArea.module.css";

type Props = {
  errorMessage?: string;
  hasOlderMessages: boolean;
  isLoadingOlderMessages: boolean;
  messages: ChatMessage[];
  onLoadOlderMessages: () => void;
  scrollToLatestKey: number;
};

const LOAD_OLDER_THRESHOLD_PX = 72;
const STICKY_BOTTOM_THRESHOLD_PX = 96;

function getInitial(nickname: string) {
  return nickname.trim().slice(0, 1) || "?";
}

export default function ChatArea({
  errorMessage,
  hasOlderMessages,
  isLoadingOlderMessages,
  messages,
  onLoadOlderMessages,
  scrollToLatestKey,
}: Props) {
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
  }, [isLoadingOlderMessages, messages.length]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    restoreScrollRef.current = null;
    shouldStickToBottomRef.current = true;
    list.scrollTop = list.scrollHeight;
  }, [scrollToLatestKey]);

  return (
    <div className={styles.root}>
      <div ref={listRef} className={styles.list} onScroll={handleScroll}>
        {isLoadingOlderMessages ? (
          <div className={styles.state}>이전 채팅을 불러오는 중...</div>
        ) : null}
        {errorMessage ? (
          <button
            type="button"
            className={styles.error}
            onClick={requestOlderMessages}
          >
            {errorMessage}
          </button>
        ) : null}
        {messages.length === 0 ? (
          <div className={styles.empty}>아직 채팅이 없습니다.</div>
        ) : (
          <ol className={styles.messages}>
            {messages.map((message) => (
              <li
                key={getChatMessageRenderKey(message)}
                className={styles.message}
              >
                <div className={styles.avatarWrap}>
                  {message.senderProfileImageUrl ? (
                    <Image
                      src={message.senderProfileImageUrl}
                      alt={`${message.senderNickname} 프로필`}
                      fill
                      sizes="40px"
                      unoptimized
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarFallback} aria-hidden="true">
                      {getInitial(message.senderNickname)}
                    </div>
                  )}
                </div>
                <p className={styles.messageText}>
                  <span className={styles.nickname}>
                    {message.senderNickname}
                  </span>
                  <span className={styles.content}>{message.content}</span>
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
