"use client";

import type { KeyboardEvent } from "react";
import { CHAT_MAX_LENGTH } from "../constants/chat";
import styles from "./RoomChatComposer.module.css";

type ChatMessageInputProps = {
  disabled: boolean;
  disabledReason?: string;
  value: string;
  onChange: (value: string) => void;
  onCompositionEnd: () => void;
  onCompositionStart: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
};

export default function ChatMessageInput({
  disabled,
  disabledReason,
  value,
  onChange,
  onCompositionEnd,
  onCompositionStart,
  onKeyDown,
}: ChatMessageInputProps) {
  return (
    <textarea
      className={styles.input}
      disabled={disabled}
      maxLength={CHAT_MAX_LENGTH}
      placeholder={disabledReason ?? "채팅을 입력하세요"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
      onKeyDown={onKeyDown}
    />
  );
}
