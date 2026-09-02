"use client";

import { useMemo, useState } from "react";
import {
  createYouTubeQueueRequest,
  parseYouTubeQueueSource,
  type YouTubeQueueMode,
} from "../model/parseYouTubeQueueSource";

export const ADD_TRACK_STORY_MAX_LENGTH = 30;
export type AddTrackErrorField =
  | "url"
  | "queueMode"
  | "story"
  | "form"
  | null;

export function useAddTrackForm() {
  const [inputValue, setInputValue] = useState("");
  const [storyValue, setStoryValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] = useState<AddTrackErrorField>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queueMode, setQueueMode] = useState<YouTubeQueueMode | null>(null);
  const queueSource = useMemo(
    () => parseYouTubeQueueSource(inputValue),
    [inputValue],
  );
  const queueRequest = useMemo(
    () => createYouTubeQueueRequest(queueSource, queueMode),
    [queueMode, queueSource],
  );

  const updateInputValue = (value: string) => {
    setInputValue(value);
    setQueueMode(null);
    if (
      errorField === "url" ||
      errorField === "queueMode" ||
      errorField === "form"
    ) {
      setErrorMessage("");
      setErrorField(null);
    }
  };

  const updateQueueMode = (mode: YouTubeQueueMode) => {
    if (
      mode === "single" &&
      queueSource?.kind === "playlist" &&
      !queueSource.currentVideoId
    ) {
      return;
    }

    setQueueMode(mode);
    if (errorField === "queueMode" || errorField === "form") {
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
    setQueueMode(null);
  };

  return {
    canSubmit: Boolean(queueRequest),
    errorMessage,
    errorField,
    inputValue,
    isSubmitting,
    queueMode,
    queueRequest,
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
    updateQueueMode,
    updateStoryValue,
    queueSource,
  };
}
