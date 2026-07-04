"use client";

import { useState, type FormEvent } from "react";
import { useUpdateRoom } from "../model/useUpdateRoom";
import { buildUpdateRoomPayload } from "../model/buildUpdateRoomPayload";
import { useRoomThumbnailSelection } from "../../hooks/useRoomThumbnailSelection";
import { useUploadRoomThumbnail } from "../../hooks/useUploadRoomThumbnail";

const MAX_TAGS = 5;
const MAX_ROOM_TITLE_LENGTH = 255;
const MAX_PARTICIPANTS = 250;

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

function parseMaxParticipants(value: string): {
  error: string | null;
  value: number | null;
} {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return {
      error: null,
      value: null,
    };
  }

  if (!/^\d+$/.test(trimmedValue)) {
    return {
      error: "숫자만 입력해주세요.",
      value: null,
    };
  }

  const parsedValue = Number.parseInt(trimmedValue, 10);

  if (parsedValue < 1 || parsedValue > MAX_PARTICIPANTS) {
    return {
      error: `1~${MAX_PARTICIPANTS}명 사이로 입력해주세요.`,
      value: null,
    };
  }

  return {
    error: null,
    value: parsedValue,
  };
}

function toDigitsOnly(value: string) {
  return value.replace(/\D/g, "").slice(0, 3);
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
  const uploadRoomThumbnailMutation = useUploadRoomThumbnail();
  const thumbnailSelection = useRoomThumbnailSelection();
  const normalizedInitialMaxParticipants =
    typeof initialMaxParticipants === "number" ? initialMaxParticipants : null;
  const [savedTitle, setSavedTitle] = useState(() => initialTitle);
  const [savedMaxParticipants, setSavedMaxParticipants] = useState<
    number | null
  >(() => normalizedInitialMaxParticipants);
  const [savedTagSlugs, setSavedTagSlugs] = useState<string[]>(() =>
    initialTagSlugs.slice(0, MAX_TAGS),
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
    initialTagSlugs.slice(0, MAX_TAGS),
  );

  const isSubmitting =
    updateRoomMutation.isPending || uploadRoomThumbnailMutation.isPending;
  const trimmedTitle = title.trim();
  const trimmedPassword = password.trim();
  const parsedMaxParticipants = parseMaxParticipants(maxParticipants);
  const hasThumbnailBlockingError = Boolean(thumbnailSelection.errorMessage);
  const isPasswordRequired =
    isPasswordChangeEnabled && trimmedPassword.length === 0;
  const canSubmit =
    trimmedTitle.length > 0 &&
    !isPasswordRequired &&
    !parsedMaxParticipants.error &&
    !hasThumbnailBlockingError &&
    !isSubmitting &&
    !!roomSlug;

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
    setTitle(value.slice(0, MAX_ROOM_TITLE_LENGTH));
  };

  const updateMaxParticipants = (value: string) => {
    setMaxParticipants(toDigitsOnly(value));
  };

  const clearMaxParticipants = () => {
    setMaxParticipants("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !trimmedTitle ||
      isPasswordRequired ||
      parsedMaxParticipants.error ||
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
      maxParticipants: parsedMaxParticipants.value,
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
        setSavedMaxParticipants(parsedMaxParticipants.value);
        setMaxParticipants(formatMaxParticipants(parsedMaxParticipants.value));
        setSavedTagSlugs(selectedTagSlugs.slice(0, MAX_TAGS));
        setIsPasswordChangeEnabled(false);
        setIsPasswordClearEnabled(false);
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
    clearMaxParticipants,
    clearThumbnailSelection,
    handleSubmit,
    isPasswordClearEnabled,
    isPasswordChangeEnabled,
    isPasswordRequired,
    isSubmitting,
    isThumbnailPreviewUnavailable: thumbnailSelection.isPreviewUnavailable,
    maxParticipants,
    maxParticipantsError: parsedMaxParticipants.error,
    maxParticipantsLimit: MAX_PARTICIPANTS,
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
    updateMaxParticipants,
    updatePasswordClearEnabled,
    updatePasswordChangeEnabled,
    updateThumbnailFiles,
    onThumbnailPreviewError: thumbnailSelection.markPreviewUnavailable,
    updateTitle,
  };
}
