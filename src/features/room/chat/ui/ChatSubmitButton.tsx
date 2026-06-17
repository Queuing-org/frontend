"use client";

import Image from "next/image";
import styles from "./RoomChatComposer.module.css";

type ChatSubmitButtonProps = {
  disabled: boolean;
};

export default function ChatSubmitButton({ disabled }: ChatSubmitButtonProps) {
  return (
    <button
      type="submit"
      className={styles.submitButton}
      disabled={disabled}
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
  );
}
