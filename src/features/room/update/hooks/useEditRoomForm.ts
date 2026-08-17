"use client";

import { useState, type FormEvent } from "react";
import { useUpdateRoom } from "../model/useUpdateRoom";
import { useUpdateRoomThumbnail } from "../model/useUpdateRoomThumbnail";
import { useDeleteRoomThumbnail } from "../model/useDeleteRoomThumbnail";
import { buildUpdateRoomPayload } from "../model/buildUpdateRoomPayload";
import { useUploadTemporaryRoomThumbnail } from "../../hooks/useUploadTemporaryRoomThumbnail";
import { useRoomThumbnailSelection } from "../../hooks/useRoomThumbnailSelection";
import {
  ROOM_MAX_PARTICIPANT_OPTIONS,
  ROOM_TAG_LIMIT,
  ROOM_TRACK_LIMIT_MINUTE_OPTIONS,
  ROOM_TITLE_MAX_LENGTH,
} from "../../model/roomFormLimits";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";

type UseEditRoomFormParams = {
  initialHasPassword: boolean;
  initialMaxParticipants: number | null;
  initialTagSlugs: string[];
  initialTrackLimitMinutes: number | null;
  initialTitle: string;
  initialHasThumbnail: boolean;
  onClose: () => void;
  roomAccessToken?: string;
  roomSlug?: string;
};

type EditRoomValidationField = "password" | "tags" | "title";

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

function formatTrackLimitMinutes(value: number | null) {
  return typeof value === "number" ? String(value) : "";
}

function parseTrackLimitMinutes(value: string): number | null {
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
  initialTrackLimitMinutes,
  initialTitle,
  initialHasThumbnail,
  onClose,
  roomAccessToken,
  roomSlug,
}: UseEditRoomFormParams) {
  const updateRoomMutation = useUpdateRoom();
  const { notify } = useActionFeedback();
  const updateRoomThumbnailMutation = useUpdateRoomThumbnail();
  const deleteRoomThumbnailMutation = useDeleteRoomThumbnail();
  const uploadTemporaryRoomThumbnailMutation =
    useUploadTemporaryRoomThumbnail();
  const thumbnailSelection = useRoomThumbnailSelection();
  const normalizedInitialMaxParticipants =
    typeof initialMaxParticipants === "number" ? initialMaxParticipants : null;
  const normalizedInitialTrackLimitMinutes =
    typeof initialTrackLimitMinutes === "number"
      ? initialTrackLimitMinutes
      : null;
  const [savedTitle, setSavedTitle] = useState(() => initialTitle);
  const [savedMaxParticipants, setSavedMaxParticipants] = useState<
    number | null
  >(() => normalizedInitialMaxParticipants);
  const [savedTagSlugs, setSavedTagSlugs] = useState<string[]>(() =>
    initialTagSlugs.slice(0, ROOM_TAG_LIMIT),
  );
  const [savedTrackLimitMinutes, setSavedTrackLimitMinutes] = useState<
    number | null
  >(() => normalizedInitialTrackLimitMinutes);
  const [title, setTitle] = useState(() => initialTitle);
  const [maxParticipants, setMaxParticipants] = useState(() =>
    formatMaxParticipants(normalizedInitialMaxParticipants),
  );
  const [trackLimitMinutes, setTrackLimitMinutes] = useState(() =>
    formatTrackLimitMinutes(normalizedInitialTrackLimitMinutes),
  );
  const [password, setPassword] = useState("");
  const [isPasswordClearEnabled, setIsPasswordClearEnabled] = useState(false);
  const [isPasswordChangeEnabled, setIsPasswordChangeEnabled] =
    useState(false);
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>(() =>
    initialTagSlugs.slice(0, ROOM_TAG_LIMIT),
  );
  const [thumbnailOption, setThumbnailOption] = useState<
    "upload" | "default"
  >(() => (initialHasThumbnail ? "upload" : "default"));
  const [
    didSaveRoomInfoBeforeThumbnailMutationError,
    setDidSaveRoomInfoBeforeThumbnailMutationError,
  ] = useState(false);
  const [invalidFields, setInvalidFields] = useState<
    Partial<Record<EditRoomValidationField, true>>
  >({});

  const isSubmitting =
    updateRoomMutation.isPending ||
    updateRoomThumbnailMutation.isPending ||
    deleteRoomThumbnailMutation.isPending ||
    uploadTemporaryRoomThumbnailMutation.isPending;
  const trimmedTitle = title.trim();
  const trimmedPassword = password.trim();
  const parsedMaxParticipants = parseMaxParticipants(maxParticipants);
  const parsedTrackLimitMinutes = parseTrackLimitMinutes(trackLimitMinutes);
  const isPasswordRequired =
    isPasswordChangeEnabled && trimmedPassword.length === 0;
  const thumbnailErrorMessage =
    thumbnailSelection.errorMessage ??
    (uploadTemporaryRoomThumbnailMutation.error
      ? `썸네일 업로드 실패: ${uploadTemporaryRoomThumbnailMutation.error.message}`
      : null);
  const hasSelectedThumbnailWithoutToken = Boolean(
    thumbnailSelection.file &&
      !uploadTemporaryRoomThumbnailMutation.data?.uploadToken,
  );
  const canSubmit = !isSubmitting && !!roomSlug && !!roomAccessToken;
  const clearValidationError = (field: EditRoomValidationField) => {
    setInvalidFields((currentFields) => {
      if (!currentFields[field]) {
        return currentFields;
      }

      const nextFields = { ...currentFields };
      delete nextFields[field];
      return nextFields;
    });
  };

  const toggleTag = (slug: string) => {
    clearValidationError("tags");
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
    clearValidationError("password");
    setIsPasswordChangeEnabled(enabled);

    if (enabled) {
      setIsPasswordClearEnabled(false);
    }

    if (!enabled) {
      setPassword("");
    }
  };

  const updatePasswordClearEnabled = (enabled: boolean) => {
    clearValidationError("password");
    setIsPasswordClearEnabled(enabled);

    if (enabled) {
      setIsPasswordChangeEnabled(false);
      setPassword("");
    }
  };

  const updateTitle = (value: string) => {
    setTitle(value.slice(0, ROOM_TITLE_MAX_LENGTH));
    clearValidationError("title");
  };

  const updateMaxParticipants = (value: string) => {
    setMaxParticipants(value);
  };

  const updateTrackLimitMinutes = (value: string) => {
    setTrackLimitMinutes(value);
  };

  const updatePassword = (value: string) => {
    setPassword(value);
    clearValidationError("password");
  };

  const handleThumbnailChange = (files: FileList | null) => {
    uploadTemporaryRoomThumbnailMutation.reset();
    updateRoomThumbnailMutation.reset();
    deleteRoomThumbnailMutation.reset();
    setDidSaveRoomInfoBeforeThumbnailMutationError(false);
    const selectedFile = thumbnailSelection.selectFile(files);

    if (selectedFile) {
      setThumbnailOption("upload");
      uploadTemporaryRoomThumbnailMutation.mutate(
        { file: selectedFile },
        {
          onError: (error) => {
            notify({
              dedupeKey: `room-update:${roomSlug ?? "unknown"}:thumbnail`,
              message: error.message || "썸네일을 업로드하지 못했습니다.",
              tone: "error",
            });
          },
        },
      );
    }
  };

  const selectDefaultThumbnail = () => {
    uploadTemporaryRoomThumbnailMutation.reset();
    updateRoomThumbnailMutation.reset();
    deleteRoomThumbnailMutation.reset();
    setDidSaveRoomInfoBeforeThumbnailMutationError(false);
    thumbnailSelection.clearSelection();
    setThumbnailOption("default");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!roomSlug || !roomAccessToken || isSubmitting) {
      return;
    }

    const validationMessage = !trimmedTitle
      ? "방 제목을 입력해 주세요."
      : selectedTagSlugs.length === 0
        ? "장르를 하나 이상 선택해 주세요."
        : isPasswordRequired
          ? "새 비밀번호를 입력해 주세요."
          : thumbnailErrorMessage
            ? thumbnailErrorMessage
            : hasSelectedThumbnailWithoutToken
              ? "썸네일 업로드가 끝날 때까지 기다려 주세요."
              : null;

    if (validationMessage) {
      setInvalidFields((currentFields) => ({
        ...currentFields,
        ...(!trimmedTitle ? { title: true as const } : {}),
        ...(selectedTagSlugs.length === 0 ? { tags: true as const } : {}),
        ...(isPasswordRequired ? { password: true as const } : {}),
      }));
      notify({
        dedupeKey: !trimmedTitle
          ? `room-update:${roomSlug}:title`
          : selectedTagSlugs.length === 0
            ? `room-update:${roomSlug}:tags`
            : isPasswordRequired
              ? `room-update:${roomSlug}:password`
              : `room-update:${roomSlug}:thumbnail`,
        message: validationMessage,
        tone: "error",
      });
      return;
    }

    const payload = buildUpdateRoomPayload({
      initialMaxParticipants: savedMaxParticipants,
      initialTagSlugs: savedTagSlugs,
      initialTrackLimitMinutes: savedTrackLimitMinutes,
      initialTitle: savedTitle,
      isPasswordClearEnabled: initialHasPassword && isPasswordClearEnabled,
      isPasswordChangeEnabled,
      maxParticipants: parsedMaxParticipants,
      password,
      selectedTagSlugs,
      trackLimitMinutes: parsedTrackLimitMinutes,
      title,
    });
    const thumbnailUploadToken =
      uploadTemporaryRoomThumbnailMutation.data?.uploadToken;
    const shouldDeleteThumbnail =
      initialHasThumbnail &&
      thumbnailOption === "default" &&
      !thumbnailUploadToken;
    if (!payload && !thumbnailUploadToken && !shouldDeleteThumbnail) {
      onClose();
      return;
    }

    let didSaveRoomInfo = false;
    try {
      if (payload) {
        await updateRoomMutation.mutateAsync({
          accessToken: roomAccessToken,
          slug: roomSlug,
          payload,
        });
        setSavedTitle(trimmedTitle);
        setSavedMaxParticipants(parsedMaxParticipants);
        setMaxParticipants(formatMaxParticipants(parsedMaxParticipants));
        setSavedTagSlugs(selectedTagSlugs.slice(0, ROOM_TAG_LIMIT));
        setSavedTrackLimitMinutes(parsedTrackLimitMinutes);
        setTrackLimitMinutes(
          formatTrackLimitMinutes(parsedTrackLimitMinutes),
        );
        setIsPasswordChangeEnabled(false);
        setIsPasswordClearEnabled(false);
        setPassword("");
        didSaveRoomInfo = true;
      }

      if (thumbnailUploadToken) {
        setDidSaveRoomInfoBeforeThumbnailMutationError(
          (didSave) => didSave || Boolean(payload),
        );
        await updateRoomThumbnailMutation.mutateAsync({
          accessToken: roomAccessToken,
          slug: roomSlug,
          thumbnailUploadToken,
        });
      } else if (shouldDeleteThumbnail) {
        setDidSaveRoomInfoBeforeThumbnailMutationError(
          (didSave) => didSave || Boolean(payload),
        );
        await deleteRoomThumbnailMutation.mutateAsync({
          accessToken: roomAccessToken,
          slug: roomSlug,
        });
      }

      notify({
        dedupeKey: `room-update:${roomSlug}`,
        message: "방 정보가 변경되었어요",
        tone: "default",
      });
      onClose();
    } catch (error) {
      notify({
        dedupeKey: `room-update:${roomSlug}`,
        message:
          (didSaveRoomInfo ||
            didSaveRoomInfoBeforeThumbnailMutationError) &&
          (thumbnailUploadToken || shouldDeleteThumbnail)
            ? shouldDeleteThumbnail
              ? "방 정보는 저장했지만 썸네일을 삭제하지 못했습니다."
              : "방 정보는 저장했지만 썸네일을 변경하지 못했습니다."
            : error instanceof Error && error.message
              ? error.message
              : "방 설정을 변경하지 못했습니다.",
        tone: "error",
      });
    }
  };

  return {
    canSubmit,
    handleSubmit,
    handleThumbnailChange,
    isPasswordClearEnabled,
    isPasswordChangeEnabled,
    isPasswordRequired,
    passwordInvalid: Boolean(invalidFields.password && isPasswordRequired),
    tagsInvalid: Boolean(
      invalidFields.tags && selectedTagSlugs.length === 0,
    ),
    isSubmitting,
    maxParticipants,
    maxParticipantOptions: ROOM_MAX_PARTICIPANT_OPTIONS,
    maxRoomTitleLength: ROOM_TITLE_MAX_LENGTH,
    maxTags: ROOM_TAG_LIMIT,
    password,
    selectedTagSlugs,
    setPassword: updatePassword,
    submitError:
      updateRoomMutation.error ??
      updateRoomThumbnailMutation.error ??
      deleteRoomThumbnailMutation.error,
    submitErrorPrefix:
      didSaveRoomInfoBeforeThumbnailMutationError
        ? deleteRoomThumbnailMutation.error
          ? "방 정보는 저장됐지만 썸네일 삭제 실패"
          : updateRoomThumbnailMutation.error
            ? "방 정보는 저장됐지만 썸네일 교체 실패"
            : "수정 실패"
        : "수정 실패",
    thumbnailErrorMessage,
    thumbnailFileName: thumbnailSelection.fileName,
    thumbnailPreviewUrl: thumbnailSelection.previewUrl,
    thumbnailOption,
    thumbnailStatusMessage: uploadTemporaryRoomThumbnailMutation.isPending
      ? "썸네일 업로드 중"
      : null,
    isThumbnailPreviewUnavailable:
      thumbnailSelection.isPreviewUnavailable,
    markThumbnailPreviewUnavailable:
      thumbnailSelection.markPreviewUnavailable,
    selectDefaultThumbnail,
    title,
    titleInvalid: Boolean(invalidFields.title && !trimmedTitle),
    trackLimitMinutes,
    trackLimitMinuteOptions: ROOM_TRACK_LIMIT_MINUTE_OPTIONS,
    toggleTag,
    updateMaxParticipants,
    updatePasswordClearEnabled,
    updatePasswordChangeEnabled,
    updateTrackLimitMinutes,
    updateTitle,
  };
}
