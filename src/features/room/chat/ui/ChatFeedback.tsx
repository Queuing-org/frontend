"use client";

import ChatLoginAction from "./ChatLoginAction";
import styles from "./RoomChatComposer.module.css";

type ChatFeedbackProps = {
  disabledReason?: string;
  errorMessage?: string;
  onLoginClick?: () => void;
  showLoginAction?: boolean;
};

export default function ChatFeedback({
  disabledReason,
  errorMessage,
  onLoginClick,
  showLoginAction = false,
}: ChatFeedbackProps) {
  if (!errorMessage && !disabledReason) {
    return null;
  }

  return (
    <div className={errorMessage ? styles.error : styles.notice}>
      <span className={styles.feedbackText}>
        {errorMessage || disabledReason}
      </span>
      {!errorMessage && showLoginAction && onLoginClick ? (
        <ChatLoginAction onClick={onLoginClick} />
      ) : null}
    </div>
  );
}
