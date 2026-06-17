"use client";

import { useMemo, useState } from "react";
import { extractYouTubeVideoId } from "../model/extractYouTubeVideoId";

export function useAddTrackForm() {
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoId = useMemo(
    () => extractYouTubeVideoId(inputValue),
    [inputValue],
  );

  const updateInputValue = (value: string) => {
    setInputValue(value);
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const reset = () => {
    setInputValue("");
    setErrorMessage("");
    setIsSubmitting(false);
  };

  return {
    canSubmit: Boolean(videoId),
    errorMessage,
    inputValue,
    isSubmitting,
    reset,
    setErrorMessage,
    setIsSubmitting,
    updateInputValue,
    videoId,
  };
}
