"use client";

import { useState } from "react";
import styles from "./RoomChatComposer.module.css";

type Props = {
  disabledReason?: string;
  errorMessage?: string;
  isSending: boolean;
  onSendMessage: (message: string) => boolean;
};

const MAX_CHAT_LENGTH = 200;

export default function RoomChatComposer({
  disabledReason,
  errorMessage,
  isSending,
  onSendMessage,
}: Props) {
  const [message, setMessage] = useState("");
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
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey) {
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
          <span className={styles.submitIcon} aria-hidden="true" />
        </button>
      </div>
      {errorMessage || disabledReason ? (
        <div className={errorMessage ? styles.error : styles.notice}>
          {errorMessage || disabledReason}
        </div>
      ) : null}
    </form>
  );
}
