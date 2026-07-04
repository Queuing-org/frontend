"use client";

import { useMemo, useState } from "react";
import { extractYouTubeVideoId } from "../model/extractYouTubeVideoId";

export const ADD_TRACK_STORY_MAX_LENGTH = 300;

export function useAddTrackForm() {
  const [inputValue, setInputValue] = useState("");
  const [storyValue, setStoryValue] = useState("");
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

  const updateStoryValue = (value: string) => {
    setStoryValue(value.slice(0, ADD_TRACK_STORY_MAX_LENGTH));
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const reset = () => {
    setInputValue("");
    setStoryValue("");
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
    storyLength: storyValue.length,
    storyMaxLength: ADD_TRACK_STORY_MAX_LENGTH,
    storyValue,
    updateInputValue,
    updateStoryValue,
    videoId,
  };
}
