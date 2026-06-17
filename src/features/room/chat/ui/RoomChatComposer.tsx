"use client";

import { CHAT_MAX_LENGTH } from "../constants/chat";
import { useChatComposerState } from "../hooks/useChatComposerState";
import ChatFeedback from "./ChatFeedback";
import ChatMessageInput from "./ChatMessageInput";
import ChatSubmitButton from "./ChatSubmitButton";
import styles from "./RoomChatComposer.module.css";

type Props = {
  disabledReason?: string;
  errorMessage?: string;
  isSending: boolean;
  onLoginClick?: () => void;
  onSendMessage: (message: string) => boolean;
  showLoginAction?: boolean;
};

export default function RoomChatComposer({
  disabledReason,
  errorMessage,
  isSending,
  onLoginClick,
  onSendMessage,
  showLoginAction = false,
}: Props) {
  const composer = useChatComposerState({
    disabledReason,
    isSending,
    onSendMessage,
  });

  return (
    <form
      className={styles.root}
      onSubmit={(event) => {
        event.preventDefault();
        composer.submitMessage();
      }}
    >
      <ChatMessageInput
        disabled={composer.isDisabled}
        disabledReason={disabledReason}
        value={composer.message}
        onChange={composer.setMessage}
        onCompositionStart={composer.startComposition}
        onCompositionEnd={composer.endComposition}
        onKeyDown={composer.handleEnterKeyDown}
      />
      <div className={styles.footer}>
        <span className={styles.count}>
          {composer.trimmedMessage.length}/{CHAT_MAX_LENGTH}
        </span>
        <ChatSubmitButton disabled={composer.isSubmitDisabled} />
      </div>
      <ChatFeedback
        disabledReason={disabledReason}
        errorMessage={errorMessage}
        onLoginClick={onLoginClick}
        showLoginAction={showLoginAction}
      />
    </form>
  );
}
