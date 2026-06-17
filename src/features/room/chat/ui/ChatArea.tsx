"use client";

import Image from "next/image";
import type { ChatMessage } from "@/src/features/room/model/types";
import { useChatScrollRestoration } from "../hooks/useChatScrollRestoration";
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
  const { handleScroll, listRef, requestOlderMessages } =
    useChatScrollRestoration({
      hasOlderMessages,
      isLoadingOlderMessages,
      messageCount: messages.length,
      onLoadOlderMessages,
      scrollToLatestKey,
    });

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
