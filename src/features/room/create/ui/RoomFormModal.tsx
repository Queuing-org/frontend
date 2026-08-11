"use client";

import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useRoomTags } from "@/src/features/room/hooks/useRoomTags";
import { useCreateRoom } from "@/src/features/room/create/model/useCreateRoom";
import { useUploadTemporaryRoomThumbnail } from "@/src/features/room/hooks/useUploadTemporaryRoomThumbnail";
import { useRoomThumbnailSelection } from "@/src/features/room/hooks/useRoomThumbnailSelection";
import {
  ROOM_MAX_PARTICIPANT_OPTIONS,
  ROOM_TAG_LIMIT,
  ROOM_TITLE_MAX_LENGTH,
} from "@/src/features/room/model/roomFormLimits";
import { writeStoredRoomJoinPassword } from "@/src/features/room/join/lib/roomJoinPasswordStorage";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import QueryBoundary from "@/src/shared/ui/query-boundary/QueryBoundary";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import CreateBasicInfoStep from "./CreateBasicInfoStep";
import CreateGenreStep from "./CreateGenreStep";
import CreateSettingsStep, {
  type ParticipationMode,
} from "./CreateSettingsStep";
import EditRoomFormModal from "./EditRoomFormModal";
import styles from "./RoomFormModal.module.css";

const TRACK_LIMIT_MINUTE_OPTIONS = [
  5,
  10,
  15,
  20,
  25,
  30,
  60,
  90,
  120,
  180,
  240,
] as const;
const EMPTY_TAG_SLUGS: string[] = [];
const REQUIRED_TAG_ERROR_MESSAGE = "태그는 1개 이상 골라주세요";

type RoomFormModalMode = "create" | "edit";

type RoomFormModalProps = {
  open: boolean;
  mode: RoomFormModalMode;
  roomSlug?: string;
  initialTitle?: string;
  initialTagSlugs?: string[];
  initialHasPassword?: boolean;
  initialMaxParticipants?: number | null;
  initialThumbnailUrl?: string | null;
  onClose: () => void;
};

const createSteps = [
  { label: "기본 정보", title: "기본 정보" },
  { label: "장르 선택", title: "장르 선택" },
  { label: "세부 설정", title: "세부 설정" },
] as const;

function parseOptionalTrackLimitMinutes(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const parsedValue = Number.parseInt(trimmedValue, 10);

  return TRACK_LIMIT_MINUTE_OPTIONS.some((minutes) => minutes === parsedValue)
    ? parsedValue
    : undefined;
}

export default function RoomFormModal({
  open,
  mode,
  roomSlug,
  initialTitle = "",
  initialTagSlugs = EMPTY_TAG_SLUGS,
  initialHasPassword = false,
  initialMaxParticipants = null,
  initialThumbnailUrl = null,
  onClose,
}: RoomFormModalProps) {
  if (!open || typeof document === "undefined") {
    return null;
  }

  const portalRoot = document.body;

  if (mode === "edit") {
    return createPortal(
      <EditRoomFormModal
        open={open}
        roomSlug={roomSlug}
        initialTitle={initialTitle}
        initialTagSlugs={initialTagSlugs}
        initialHasPassword={initialHasPassword}
        initialMaxParticipants={initialMaxParticipants}
        initialThumbnailUrl={initialThumbnailUrl}
        onClose={onClose}
      />,
      portalRoot,
    );
  }

  return createPortal(<CreateRoomFormModal onClose={onClose} />, portalRoot);
}

type CreateRoomFormModalProps = {
  onClose: () => void;
};

function CreateRoomFormModal({ onClose }: CreateRoomFormModalProps) {
  const router = useRouter();
  const createRoomMutation = useCreateRoom();
  const uploadTemporaryRoomThumbnailMutation =
    useUploadTemporaryRoomThumbnail();
  const thumbnailSelection = useRoomThumbnailSelection();
  const [currentStep, setCurrentStep] = useState(0);
  const [furthestVisitedStep, setFurthestVisitedStep] = useState(0);
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [participationMode, setParticipationMode] =
    useState<ParticipationMode>("public");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [trackLimitMinutes, setTrackLimitMinutes] = useState("");
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);
  const [showTagSelectionError, setShowTagSelectionError] = useState(false);
  const [didTryFinish, setDidTryFinish] = useState(false);
  const [isNavigatingToCreatedRoom, setIsNavigatingToCreatedRoom] =
    useState(false);

  const trimmedTitle = title.trim();
  const trimmedPassword = password.trim();
  const isSubmitting =
    createRoomMutation.isPending ||
    uploadTemporaryRoomThumbnailMutation.isPending ||
    isNavigatingToCreatedRoom;
  const needsPassword =
    participationMode === "password" && trimmedPassword.length === 0;
  const parsedMaxParticipants = ROOM_MAX_PARTICIPANT_OPTIONS.find(
    (option) => String(option) === maxParticipants,
  );
  const parsedTrackLimitMinutes =
    parseOptionalTrackLimitMinutes(trackLimitMinutes);
  const maxParticipantsError =
    parsedMaxParticipants === undefined
      ? "최대 인원을 선택해주세요."
      : null;
  const hasSettingsValidationError = Boolean(maxParticipantsError);
  const thumbnailUploadErrorMessage = uploadTemporaryRoomThumbnailMutation.error
    ? `썸네일 업로드 실패: ${uploadTemporaryRoomThumbnailMutation.error.message}`
    : null;
  const hasSelectedThumbnailWithoutToken = Boolean(
    thumbnailSelection.file &&
      !uploadTemporaryRoomThumbnailMutation.data?.uploadToken,
  );
  const hasThumbnailBlockingError = Boolean(
    thumbnailSelection.errorMessage || thumbnailUploadErrorMessage,
  );
  const canGoNext =
    currentStep === 0
      ? trimmedTitle.length > 0 &&
        !isSubmitting &&
        !hasThumbnailBlockingError &&
        !hasSelectedThumbnailWithoutToken
      : currentStep === 1
        ? selectedTagSlugs.length > 0 && !isSubmitting
        : !isSubmitting;
  const stepTitle = createSteps[currentStep].title;

  const toggleTag = (slug: string) => {
    setShowTagSelectionError(false);
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

  const visitStep = (step: number) => {
    const nextStep = Math.min(Math.max(step, 0), createSteps.length - 1);
    setCurrentStep(nextStep);
    setFurthestVisitedStep((furthestStep) =>
      Math.max(furthestStep, nextStep),
    );
  };

  const requestStep = (step: number) => {
    if (currentStep === 1 && step > 1 && selectedTagSlugs.length === 0) {
      setShowTagSelectionError(true);
      return;
    }

    visitStep(step);
  };

  const goToPreviousStep = () => {
    visitStep(currentStep - 1);
  };

  const goToNextStep = () => {
    if (!canGoNext) {
      return;
    }

    requestStep(currentStep + 1);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (currentStep < createSteps.length - 1) {
      goToNextStep();
    }
  };

  const navigateToRoom = (slug: string, roomPassword?: string) => {
    const normalizedSlug = normalizeRoomSlug(slug);

    if (roomPassword) {
      writeStoredRoomJoinPassword(normalizedSlug, roomPassword);
    }

    setIsNavigatingToCreatedRoom(true);
    router.push(`/room/${encodeURIComponent(normalizedSlug)}`);
  };

  const finishCreateRoom = async () => {
    setDidTryFinish(true);

    if (!trimmedTitle) {
      visitStep(0);
      return;
    }

    if (selectedTagSlugs.length === 0) {
      setShowTagSelectionError(true);
      visitStep(1);
      return;
    }

    if (
      needsPassword ||
      isSubmitting ||
      hasThumbnailBlockingError ||
      hasSelectedThumbnailWithoutToken
    ) {
      return;
    }

    if (hasSettingsValidationError) {
      visitStep(createSteps.length - 1);
      return;
    }

    try {
      const createdRoomPassword =
        participationMode === "password" && trimmedPassword
          ? trimmedPassword
          : undefined;
      const result = await createRoomMutation.mutateAsync({
        title: trimmedTitle,
        tags: selectedTagSlugs,
        maxParticipants: parsedMaxParticipants,
        ...(createdRoomPassword ? { password: createdRoomPassword } : {}),
        ...(typeof parsedTrackLimitMinutes === "number"
          ? { trackLimitMinutes: parsedTrackLimitMinutes }
          : {}),
        ...(uploadTemporaryRoomThumbnailMutation.data?.uploadToken
          ? {
              thumbnailUploadToken:
                uploadTemporaryRoomThumbnailMutation.data.uploadToken,
            }
          : {}),
      });

      navigateToRoom(result.slug, createdRoomPassword);
    } catch {
      setIsNavigatingToCreatedRoom(false);
    }
  };

  const handleThumbnailChange = (files: FileList | null) => {
    uploadTemporaryRoomThumbnailMutation.reset();
    const selectedFile = thumbnailSelection.selectFile(files);

    if (selectedFile) {
      uploadTemporaryRoomThumbnailMutation.mutate({ file: selectedFile });
    }
  };

  const handleThumbnailClear = () => {
    uploadTemporaryRoomThumbnailMutation.reset();
    thumbnailSelection.clearSelection();
  };

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <CreateBasicInfoStep
          title={title}
          maxTitleLength={ROOM_TITLE_MAX_LENGTH}
          disabled={createRoomMutation.isPending || isNavigatingToCreatedRoom}
          thumbnailDisabled={isSubmitting}
          thumbnailErrorMessage={
            thumbnailSelection.errorMessage ?? thumbnailUploadErrorMessage
          }
          thumbnailFileName={thumbnailSelection.fileName}
          thumbnailPreviewUrl={thumbnailSelection.previewUrl}
          thumbnailStatusMessage={
            uploadTemporaryRoomThumbnailMutation.isPending
              ? <LoadingSpinner
                  announce={false}
                  ariaLabel="썸네일 업로드 중"
                  size={14}
                />
              : null
          }
          thumbnailStatusAriaLabel={
            uploadTemporaryRoomThumbnailMutation.isPending
              ? "썸네일 업로드 중"
              : undefined
          }
          isThumbnailPreviewUnavailable={
            thumbnailSelection.isPreviewUnavailable
          }
          onTitleChange={(nextTitle) =>
            setTitle(nextTitle.slice(0, ROOM_TITLE_MAX_LENGTH))
          }
          onThumbnailChange={handleThumbnailChange}
          onThumbnailClear={handleThumbnailClear}
          onThumbnailPreviewError={thumbnailSelection.markPreviewUnavailable}
        />
      );
    }

    if (currentStep === 1) {
      return (
        <QueryBoundary
          fallback={
            <div className={styles.stepState}>
              <LoadingSpinner ariaLabel="장르 로딩 중" />
            </div>
          }
          errorTitle="장르를 불러오지 못했어요."
          errorDescription="다시 시도해 주세요."
        >
          <CreateGenreStepContent
            selectedTagSlugs={selectedTagSlugs}
            maxTags={ROOM_TAG_LIMIT}
            disabled={isSubmitting}
            errorMessage={
              showTagSelectionError ? REQUIRED_TAG_ERROR_MESSAGE : null
            }
            onToggleTag={toggleTag}
          />
        </QueryBoundary>
      );
    }

    return (
      <CreateSettingsStep
        participationMode={participationMode}
        password={password}
        maxParticipants={maxParticipants}
        trackLimitMinutes={trackLimitMinutes}
        disabled={isSubmitting}
        maxParticipantsError={
          didTryFinish ? maxParticipantsError : null
        }
        showPasswordError={didTryFinish && needsPassword}
        onMaxParticipantsChange={(nextValue) => {
          setMaxParticipants(nextValue);
          setDidTryFinish(false);
        }}
        onParticipationModeChange={(mode) => {
          setParticipationMode(mode);
          setDidTryFinish(false);
        }}
        onPasswordChange={(nextPassword) => {
          setPassword(nextPassword);
          setDidTryFinish(false);
        }}
        onTrackLimitMinutesChange={(nextValue) => {
          setTrackLimitMinutes(nextValue);
          setDidTryFinish(false);
        }}
        trackLimitMinuteOptions={TRACK_LIMIT_MINUTE_OPTIONS}
        maxParticipantOptions={ROOM_MAX_PARTICIPANT_OPTIONS}
      />
    );
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <section
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-create-modal-title"
      >
        <header className={styles.header}>
          <h2 id="room-create-modal-title" className={styles.modalTitle}>
            CREATE
          </h2>
        </header>

        <form className={styles.content} onSubmit={handleSubmit}>
          <aside className={styles.sidebar} aria-label="방 만들기 단계">
            <ol className={styles.stepList}>
              {createSteps.map((step, index) => {
                const isCurrent = index === currentStep;
                const isCompleted =
                  index <= furthestVisitedStep && index !== currentStep;
                const isReachable = index <= furthestVisitedStep;

                return (
                  <li
                    key={step.label}
                    className={styles.stepItem}
                    data-state={
                      isCurrent
                        ? "current"
                        : isCompleted
                          ? "completed"
                          : "upcoming"
                    }
                  >
                    <button
                      type="button"
                      className={styles.stepButton}
                      disabled={
                        !isReachable ||
                        isSubmitting
                      }
                      onClick={() => requestStep(index)}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      <span className={styles.stepNumber}>{index + 1}</span>
                      <span className={styles.stepLabel}>{step.label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>

          <main className={styles.main}>
            <div className={styles.stepHeader}>
              <h3 className={styles.stepTitle}>{stepTitle}</h3>
              {currentStep === 1 ? (
                <span className={styles.stepMeta}>
                  {selectedTagSlugs.length}/{ROOM_TAG_LIMIT}
                </span>
              ) : null}
            </div>

            <div className={styles.stepBody}>{renderStepContent()}</div>

            {createRoomMutation.error ? (
              <p className={styles.errorText}>
                생성 실패: {createRoomMutation.error.message}
              </p>
            ) : null}
            <div className={styles.actions}>
              {currentStep > 0 ? (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={goToPreviousStep}
                  disabled={isSubmitting}
                >
                  이전
                </button>
              ) : null}

              {currentStep < createSteps.length - 1 ? (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={goToNextStep}
                  disabled={!canGoNext}
                >
                  다음
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={finishCreateRoom}
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? (
                    <LoadingSpinner
                      ariaLabel="방 생성 중"
                      color="#ffffff"
                      size={18}
                    />
                  ) : (
                    "완료"
                  )}
                </button>
              )}
            </div>
          </main>
        </form>
      </section>
    </div>
  );
}

type CreateGenreStepContentProps = {
  disabled: boolean;
  errorMessage: string | null;
  maxTags: number;
  selectedTagSlugs: string[];
  onToggleTag: (slug: string) => void;
};

function CreateGenreStepContent({
  disabled,
  errorMessage,
  maxTags,
  selectedTagSlugs,
  onToggleTag,
}: CreateGenreStepContentProps) {
  const { data: tags } = useRoomTags();

  return (
    <CreateGenreStep
      tags={tags}
      selectedTagSlugs={selectedTagSlugs}
      maxTags={maxTags}
      disabled={disabled}
      errorMessage={errorMessage}
      onToggleTag={onToggleTag}
    />
  );
}
