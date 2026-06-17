"use client";

import styles from "./RoomChatComposer.module.css";

type ChatLoginActionProps = {
  onClick: () => void;
};

export default function ChatLoginAction({ onClick }: ChatLoginActionProps) {
  return (
    <button type="button" className={styles.loginAction} onClick={onClick}>
      로그인하기
    </button>
  );
}
