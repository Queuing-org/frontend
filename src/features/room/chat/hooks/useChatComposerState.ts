"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { CHAT_MAX_LENGTH } from "../constants/chat";

type UseChatComposerStateParams = {
  disabledReason?: string;
  isSending: boolean;
  onSendMessage: (message: string) => boolean;
};

export function useChatComposerState({
  disabledReason,
  isSending,
  onSendMessage,
}: UseChatComposerStateParams) {
  const [message, setMessage] = useState("");
  const isComposingRef = useRef(false);
  const trimmedMessage = message.trim();
  const isDisabled = Boolean(disabledReason) || isSending;
  const isSubmitDisabled =
    isDisabled ||
    trimmedMessage.length === 0 ||
    trimmedMessage.length > CHAT_MAX_LENGTH;

  const submitMessage = () => {
    if (isSubmitDisabled) {
      return;
    }

    if (onSendMessage(trimmedMessage)) {
      setMessage("");
    }
  };

  const handleEnterKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
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
  };

  const startComposition = () => {
    isComposingRef.current = true;
  };

  const endComposition = () => {
    isComposingRef.current = false;
  };

  return {
    endComposition,
    handleEnterKeyDown,
    isDisabled,
    isSubmitDisabled,
    message,
    setMessage,
    startComposition,
    submitMessage,
    trimmedMessage,
  };
}
