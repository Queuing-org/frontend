"use client";

import { useMemo, useState } from "react";
import { parseYouTubeQueueSource } from "../model/parseYouTubeQueueSource";

export const ADD_TRACK_STORY_MAX_LENGTH = 30;
export type AddTrackErrorField = "url" | "story" | "form" | null;

export function useAddTrackForm() {
  const [inputValue, setInputValue] = useState("");
  const [storyValue, setStoryValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] = useState<AddTrackErrorField>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queueSource = useMemo(
    () => parseYouTubeQueueSource(inputValue),
    [inputValue],
  );

  const updateInputValue = (value: string) => {
    setInputValue(value);
    if (errorField === "url" || errorField === "form") {
      setErrorMessage("");
      setErrorField(null);
    }
  };

  const updateStoryValue = (value: string) => {
    setStoryValue(value);
    if (errorField === "story" || errorField === "form") {
      setErrorMessage("");
      setErrorField(null);
    }
  };

  const reset = () => {
    setInputValue("");
    setStoryValue("");
    setErrorMessage("");
    setErrorField(null);
    setIsSubmitting(false);
  };

  return {
    canSubmit: Boolean(queueSource),
    errorMessage,
    errorField,
    inputValue,
    isSubmitting,
    reset,
    setErrorMessage,
    setError: (field: AddTrackErrorField, message: string) => {
      setErrorField(field);
      setErrorMessage(message);
    },
    setIsSubmitting,
    storyLength: storyValue.length,
    storyMaxLength: ADD_TRACK_STORY_MAX_LENGTH,
    storyValue,
    updateInputValue,
    updateStoryValue,
    queueSource,
  };
}
