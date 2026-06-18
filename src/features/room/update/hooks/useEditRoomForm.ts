"use client";

import { useState, type FormEvent } from "react";
import { useUpdateRoom } from "../model/useUpdateRoom";
import { buildUpdateRoomPayload } from "../model/buildUpdateRoomPayload";
import { useRoomThumbnailSelection } from "../../hooks/useRoomThumbnailSelection";
import { useUploadRoomThumbnail } from "../../hooks/useUploadRoomThumbnail";

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
  const uploadRoomThumbnailMutation = useUploadRoomThumbnail();
  const thumbnailSelection = useRoomThumbnailSelection();
  const [savedTitle, setSavedTitle] = useState(() => initialTitle);
  const [savedTagSlugs, setSavedTagSlugs] = useState<string[]>(() =>
    initialTagSlugs.slice(0, MAX_TAGS),
  );
  const [title, setTitle] = useState(() => initialTitle);
  const [password, setPassword] = useState("");
  const [isPasswordChangeEnabled, setIsPasswordChangeEnabled] =
    useState(false);
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>(() =>
    initialTagSlugs.slice(0, MAX_TAGS),
  );

  const isSubmitting =
    updateRoomMutation.isPending || uploadRoomThumbnailMutation.isPending;
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trimmedTitle || isPasswordRequired || !roomSlug) {
      return;
    }

    const payload = buildUpdateRoomPayload({
      initialTagSlugs: savedTagSlugs,
      initialTitle: savedTitle,
      isPasswordChangeEnabled,
      password,
      selectedTagSlugs,
      title,
    });
    const thumbnailFile = thumbnailSelection.file;

    if (!payload && !thumbnailFile) {
      onClose();
      return;
    }

    try {
      if (payload) {
        await updateRoomMutation.mutateAsync({
          slug: roomSlug,
          payload,
        });
        setSavedTitle(trimmedTitle);
        setSavedTagSlugs(selectedTagSlugs.slice(0, MAX_TAGS));
        setIsPasswordChangeEnabled(false);
        setPassword("");
      }

      if (thumbnailFile) {
        await uploadRoomThumbnailMutation.mutateAsync({
          slug: roomSlug,
          file: thumbnailFile,
        });
        thumbnailSelection.clearSelection();
      }

      onClose();
    } catch {
      // Mutation hooks expose the actionable error state to the modal.
    }
  };

  const updateThumbnailFiles = (files: FileList | null) => {
    uploadRoomThumbnailMutation.reset();
    thumbnailSelection.selectFile(files);
  };

  const clearThumbnailSelection = () => {
    uploadRoomThumbnailMutation.reset();
    thumbnailSelection.clearSelection();
  };

  return {
    canSubmit,
    clearThumbnailSelection,
    handleSubmit,
    isPasswordChangeEnabled,
    isPasswordRequired,
    isSubmitting,
    isThumbnailPreviewUnavailable: thumbnailSelection.isPreviewUnavailable,
    maxRoomTitleLength: MAX_ROOM_TITLE_LENGTH,
    maxTags: MAX_TAGS,
    password,
    selectedTagSlugs,
    setPassword,
    submitError: updateRoomMutation.error,
    thumbnailErrorMessage: thumbnailSelection.errorMessage,
    thumbnailFileName: thumbnailSelection.fileName,
    thumbnailPreviewUrl: thumbnailSelection.previewUrl,
    thumbnailSubmitError: uploadRoomThumbnailMutation.error,
    title,
    toggleTag,
    updateThumbnailFiles,
    updatePasswordChangeEnabled,
    onThumbnailPreviewError: thumbnailSelection.markPreviewUnavailable,
    updateTitle,
  };
}
