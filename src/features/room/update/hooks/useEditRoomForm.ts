"use client";

import { useState, type FormEvent } from "react";
import { useUpdateRoom } from "../model/useUpdateRoom";
import { useUpdateRoomThumbnail } from "../model/useUpdateRoomThumbnail";
import { buildUpdateRoomPayload } from "../model/buildUpdateRoomPayload";
import { useUploadTemporaryRoomThumbnail } from "../../hooks/useUploadTemporaryRoomThumbnail";
import { useRoomThumbnailSelection } from "../../hooks/useRoomThumbnailSelection";
import {
  ROOM_MAX_PARTICIPANT_OPTIONS,
  ROOM_TAG_LIMIT,
  ROOM_TITLE_MAX_LENGTH,
} from "../../model/roomFormLimits";

type UseEditRoomFormParams = {
  initialHasPassword: boolean;
  initialMaxParticipants: number | null;
  initialTagSlugs: string[];
  initialTitle: string;
  onClose: () => void;
  roomSlug?: string;
};

function formatMaxParticipants(value: number | null) {
  return typeof value === "number" ? String(value) : "";
}

function parseMaxParticipants(value: string): number | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return Number.parseInt(trimmedValue, 10);
}

export function useEditRoomForm({
  initialHasPassword,
  initialMaxParticipants,
  initialTagSlugs,
  initialTitle,
  onClose,
  roomSlug,
}: UseEditRoomFormParams) {
  const updateRoomMutation = useUpdateRoom();
  const updateRoomThumbnailMutation = useUpdateRoomThumbnail();
  const uploadTemporaryRoomThumbnailMutation =
    useUploadTemporaryRoomThumbnail();
  const thumbnailSelection = useRoomThumbnailSelection();
  const normalizedInitialMaxParticipants =
    typeof initialMaxParticipants === "number" ? initialMaxParticipants : null;
  const [savedTitle, setSavedTitle] = useState(() => initialTitle);
  const [savedMaxParticipants, setSavedMaxParticipants] = useState<
    number | null
  >(() => normalizedInitialMaxParticipants);
  const [savedTagSlugs, setSavedTagSlugs] = useState<string[]>(() =>
    initialTagSlugs.slice(0, ROOM_TAG_LIMIT),
  );
  const [title, setTitle] = useState(() => initialTitle);
  const [maxParticipants, setMaxParticipants] = useState(() =>
    formatMaxParticipants(normalizedInitialMaxParticipants),
  );
  const [password, setPassword] = useState("");
  const [isPasswordClearEnabled, setIsPasswordClearEnabled] = useState(false);
  const [isPasswordChangeEnabled, setIsPasswordChangeEnabled] =
    useState(false);
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>(() =>
    initialTagSlugs.slice(0, ROOM_TAG_LIMIT),
  );
  const [
    didSaveRoomInfoBeforeThumbnailError,
    setDidSaveRoomInfoBeforeThumbnailError,
  ] = useState(false);

  const isSubmitting =
    updateRoomMutation.isPending ||
    updateRoomThumbnailMutation.isPending ||
    uploadTemporaryRoomThumbnailMutation.isPending;
  const trimmedTitle = title.trim();
  const trimmedPassword = password.trim();
  const parsedMaxParticipants = parseMaxParticipants(maxParticipants);
  const isPasswordRequired =
    isPasswordChangeEnabled && trimmedPassword.length === 0;
  const canSubmit =
    trimmedTitle.length > 0 &&
    !isPasswordRequired &&
    !thumbnailSelection.errorMessage &&
    !uploadTemporaryRoomThumbnailMutation.error &&
    !(
      thumbnailSelection.file &&
      !uploadTemporaryRoomThumbnailMutation.data?.uploadToken
    ) &&
    !isSubmitting &&
    !!roomSlug;

  const toggleTag = (slug: string) => {
    setSelectedTagSlugs((previousSlugs) => {
      const exists = previousSlugs.includes(slug);

      if (exists) {
        return previousSlugs.filter((selectedSlug) => selectedSlug !== slug);
      }

      if (previousSlugs.length >= ROOM_TAG_LIMIT) {
        return previousSlugs;
      }

      return [...previousSlugs, slug];
    });
  };

  const updatePasswordChangeEnabled = (enabled: boolean) => {
    setIsPasswordChangeEnabled(enabled);

    if (enabled) {
      setIsPasswordClearEnabled(false);
    }

    if (!enabled) {
      setPassword("");
    }
  };

  const updatePasswordClearEnabled = (enabled: boolean) => {
    setIsPasswordClearEnabled(enabled);

    if (enabled) {
      setIsPasswordChangeEnabled(false);
      setPassword("");
    }
  };

  const updateTitle = (value: string) => {
    setTitle(value.slice(0, ROOM_TITLE_MAX_LENGTH));
  };

  const updateMaxParticipants = (value: string) => {
    setMaxParticipants(value);
  };

  const handleThumbnailChange = (files: FileList | null) => {
    uploadTemporaryRoomThumbnailMutation.reset();
    updateRoomThumbnailMutation.reset();
    setDidSaveRoomInfoBeforeThumbnailError(false);
    const selectedFile = thumbnailSelection.selectFile(files);

    if (selectedFile) {
      uploadTemporaryRoomThumbnailMutation.mutate({ file: selectedFile });
    }
  };

  const clearThumbnailSelection = () => {
    uploadTemporaryRoomThumbnailMutation.reset();
    updateRoomThumbnailMutation.reset();
    setDidSaveRoomInfoBeforeThumbnailError(false);
    thumbnailSelection.clearSelection();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !trimmedTitle ||
      isPasswordRequired ||
      !roomSlug
    ) {
      return;
    }

    const payload = buildUpdateRoomPayload({
      initialMaxParticipants: savedMaxParticipants,
      initialTagSlugs: savedTagSlugs,
      initialTitle: savedTitle,
      isPasswordClearEnabled: initialHasPassword && isPasswordClearEnabled,
      isPasswordChangeEnabled,
      maxParticipants: parsedMaxParticipants,
      password,
      selectedTagSlugs,
      title,
    });
    const thumbnailUploadToken =
      uploadTemporaryRoomThumbnailMutation.data?.uploadToken;
    if (!payload && !thumbnailUploadToken) {
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
        setSavedMaxParticipants(parsedMaxParticipants);
        setMaxParticipants(formatMaxParticipants(parsedMaxParticipants));
        setSavedTagSlugs(selectedTagSlugs.slice(0, ROOM_TAG_LIMIT));
        setIsPasswordChangeEnabled(false);
        setIsPasswordClearEnabled(false);
        setPassword("");
      }

      if (thumbnailUploadToken) {
        setDidSaveRoomInfoBeforeThumbnailError(
          (didSave) => didSave || Boolean(payload),
        );
        await updateRoomThumbnailMutation.mutateAsync({
          slug: roomSlug,
          thumbnailUploadToken,
        });
      }

      onClose();
    } catch {
      // Mutation hooks expose the actionable error state to the modal.
    }
  };

  return {
    canSubmit,
    clearThumbnailSelection,
    handleSubmit,
    handleThumbnailChange,
    isPasswordClearEnabled,
    isPasswordChangeEnabled,
    isPasswordRequired,
    isSubmitting,
    maxParticipants,
    maxParticipantOptions: ROOM_MAX_PARTICIPANT_OPTIONS,
    maxRoomTitleLength: ROOM_TITLE_MAX_LENGTH,
    maxTags: ROOM_TAG_LIMIT,
    password,
    selectedTagSlugs,
    setPassword,
    submitError:
      updateRoomMutation.error ?? updateRoomThumbnailMutation.error,
    submitErrorPrefix:
      updateRoomThumbnailMutation.error && didSaveRoomInfoBeforeThumbnailError
        ? "방 정보는 저장됐지만 썸네일 교체 실패"
        : "수정 실패",
    thumbnailErrorMessage:
      thumbnailSelection.errorMessage ??
      (uploadTemporaryRoomThumbnailMutation.error
        ? `썸네일 업로드 실패: ${uploadTemporaryRoomThumbnailMutation.error.message}`
        : null),
    thumbnailFileName: thumbnailSelection.fileName,
    thumbnailPreviewUrl: thumbnailSelection.previewUrl,
    thumbnailStatusMessage: uploadTemporaryRoomThumbnailMutation.isPending
      ? "썸네일 업로드 중"
      : null,
    isThumbnailPreviewUnavailable:
      thumbnailSelection.isPreviewUnavailable,
    markThumbnailPreviewUnavailable:
      thumbnailSelection.markPreviewUnavailable,
    title,
    toggleTag,
    updateMaxParticipants,
    updatePasswordClearEnabled,
    updatePasswordChangeEnabled,
    updateTitle,
  };
}
