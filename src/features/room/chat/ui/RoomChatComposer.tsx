"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import styles from "./RoomChatComposer.module.css";

type Props = {
  disabledReason?: string;
  errorMessage?: string;
  isSending: boolean;
  onLoginClick?: () => void;
  onSendMessage: (message: string) => boolean;
  showLoginAction?: boolean;
};

const MAX_CHAT_LENGTH = 200;

export default function RoomChatComposer({
  disabledReason,
  errorMessage,
  isSending,
  onLoginClick,
  onSendMessage,
  showLoginAction = false,
}: Props) {
  const [message, setMessage] = useState("");
  const isComposingRef = useRef(false);
  const trimmedMessage = message.trim();
  const isDisabled = Boolean(disabledReason) || isSending;
  const isSubmitDisabled =
    isDisabled ||
    trimmedMessage.length === 0 ||
    trimmedMessage.length > MAX_CHAT_LENGTH;

  function submitMessage() {
    if (isSubmitDisabled) {
      return;
    }

    if (onSendMessage(trimmedMessage)) {
      setMessage("");
    }
  }

  return (
    <form
      className={styles.root}
      onSubmit={(event) => {
        event.preventDefault();
        submitMessage();
      }}
    >
      <textarea
        className={styles.input}
        disabled={isDisabled}
        maxLength={MAX_CHAT_LENGTH}
        placeholder={disabledReason ?? "채팅을 입력하세요"}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={() => {
          isComposingRef.current = false;
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey) {
            return;
          }

          if (
            event.nativeEvent.isComposing ||
            event.keyCode === 229 ||
            isComposingRef.current
          ) {
            return;
          }

          event.preventDefault();
          submitMessage();
        }}
      />
      <div className={styles.footer}>
        <span className={styles.count}>
          {trimmedMessage.length}/{MAX_CHAT_LENGTH}
        </span>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitDisabled}
          aria-label="채팅 전송"
        >
          <Image
            src="/icons/send.svg"
            alt=""
            width={18}
            height={16}
            className={styles.submitIcon}
            aria-hidden="true"
          />
        </button>
      </div>
      {errorMessage || disabledReason ? (
        <div className={errorMessage ? styles.error : styles.notice}>
          <span className={styles.feedbackText}>
            {errorMessage || disabledReason}
          </span>
          {!errorMessage && showLoginAction && onLoginClick ? (
            <button
              type="button"
              className={styles.loginAction}
              onClick={onLoginClick}
            >
              로그인하기
            </button>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
