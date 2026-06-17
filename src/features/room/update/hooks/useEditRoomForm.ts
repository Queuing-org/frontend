"use client";

import { useState, type FormEvent } from "react";
import { useUpdateRoom } from "../model/useUpdateRoom";
import { buildUpdateRoomPayload } from "../model/buildUpdateRoomPayload";

const MAX_TAGS = 5;
const MAX_ROOM_TITLE_LENGTH = 18;

type UseEditRoomFormParams = {
  initialTagSlugs: string[];
  initialTitle: string;
  onClose: () => void;
  roomSlug?: string;
};

export function useEditRoomForm({
  initialTagSlugs,
  initialTitle,
  onClose,
  roomSlug,
}: UseEditRoomFormParams) {
  const updateRoomMutation = useUpdateRoom();
  const [title, setTitle] = useState(() => initialTitle);
  const [password, setPassword] = useState("");
  const [isPasswordChangeEnabled, setIsPasswordChangeEnabled] =
    useState(false);
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>(() =>
    initialTagSlugs.slice(0, MAX_TAGS),
  );

  const isSubmitting = updateRoomMutation.isPending;
  const trimmedTitle = title.trim();
  const trimmedPassword = password.trim();
  const isPasswordRequired =
    isPasswordChangeEnabled && trimmedPassword.length === 0;
  const canSubmit =
    trimmedTitle.length > 0 && !isPasswordRequired && !isSubmitting && !!roomSlug;

  const toggleTag = (slug: string) => {
    setSelectedTagSlugs((previousSlugs) => {
      const exists = previousSlugs.includes(slug);

      if (exists) {
        return previousSlugs.filter((selectedSlug) => selectedSlug !== slug);
      }

      if (previousSlugs.length >= MAX_TAGS) {
        return previousSlugs;
      }

      return [...previousSlugs, slug];
    });
  };

  const updatePasswordChangeEnabled = (enabled: boolean) => {
    setIsPasswordChangeEnabled(enabled);

    if (!enabled) {
      setPassword("");
    }
  };

  const updateTitle = (value: string) => {
    setTitle(value.slice(0, MAX_ROOM_TITLE_LENGTH));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trimmedTitle || isPasswordRequired || !roomSlug) {
      return;
    }

    const payload = buildUpdateRoomPayload({
      initialTagSlugs,
      initialTitle,
      isPasswordChangeEnabled,
      password,
      selectedTagSlugs,
      title,
    });

    if (!payload) {
      onClose();
      return;
    }

    updateRoomMutation.mutate(
      {
        slug: roomSlug,
        payload,
      },
      {
        onSuccess: onClose,
      },
    );
  };

  return {
    canSubmit,
    handleSubmit,
    isPasswordChangeEnabled,
    isPasswordRequired,
    isSubmitting,
    maxRoomTitleLength: MAX_ROOM_TITLE_LENGTH,
    maxTags: MAX_TAGS,
    password,
    selectedTagSlugs,
    setPassword,
    submitError: updateRoomMutation.error,
    title,
    toggleTag,
    updatePasswordChangeEnabled,
    updateTitle,
  };
}
