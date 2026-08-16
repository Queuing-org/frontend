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
  ROOM_TRACK_LIMIT_MINUTE_OPTIONS,
  ROOM_TITLE_MAX_LENGTH,
} from "@/src/features/room/model/roomFormLimits";
import { writeStoredRoomJoinPassword } from "@/src/features/room/join/lib/roomJoinPasswordStorage";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import QueryBoundary from "@/src/shared/ui/query-boundary/QueryBoundary";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";
import CreateBasicInfoStep from "./CreateBasicInfoStep";
import CreateGenreStep from "./CreateGenreStep";
import CreateSettingsStep, {
  type ParticipationMode,
} from "./CreateSettingsStep";
import EditRoomFormModal from "./EditRoomFormModal";
import styles from "./RoomFormModal.module.css";

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
  initialTrackLimitMinutes?: number | null;
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

  return ROOM_TRACK_LIMIT_MINUTE_OPTIONS.some(
    (minutes) => minutes === parsedValue,
  )
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
  initialTrackLimitMinutes = null,
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
        initialTrackLimitMinutes={initialTrackLimitMinutes}
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
  const { notify } = useActionFeedback();
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
  const [maxParticipants, setMaxParticipants] = useState("10");
  const [trackLimitMinutes, setTrackLimitMinutes] = useState("");
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);
  const [showTagSelectionError, setShowTagSelectionError] = useState(false);
  const [showTitleError, setShowTitleError] = useState(false);
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [showMaxParticipantsError, setShowMaxParticipantsError] =
    useState(false);
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
    if (currentStep === 0 && step > 0) {
      if (!trimmedTitle) {
        setShowTitleError(true);
        notify({
          dedupeKey: "room-create:title",
          message: "방 제목을 입력해 주세요.",
          tone: "error",
        });
        return;
      }
      if (hasThumbnailBlockingError || hasSelectedThumbnailWithoutToken) {
        notify({
          dedupeKey: "room-create:thumbnail",
          message:
            thumbnailSelection.errorMessage ||
            thumbnailUploadErrorMessage ||
            "썸네일 업로드가 끝날 때까지 기다려 주세요.",
          tone: "error",
        });
        return;
      }
    }
    if (currentStep === 1 && step > 1 && selectedTagSlugs.length === 0) {
      setShowTagSelectionError(true);
      notify({
        dedupeKey: "room-create:tags",
        message: "장르를 하나 이상 선택해 주세요.",
        tone: "error",
      });
      return;
    }

    visitStep(step);
  };

  const goToPreviousStep = () => {
    visitStep(currentStep - 1);
  };

  const goToNextStep = () => {
    if (isSubmitting) {
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
    if (!trimmedTitle) {
      setShowTitleError(true);
      notify({
        dedupeKey: "room-create:title",
        message: "방 제목을 입력해 주세요.",
        tone: "error",
      });
      visitStep(0);
      return;
    }

    if (selectedTagSlugs.length === 0) {
      setShowTagSelectionError(true);
      notify({
        dedupeKey: "room-create:tags",
        message: "장르를 하나 이상 선택해 주세요.",
        tone: "error",
      });
      visitStep(1);
      return;
    }

    setShowPasswordError(needsPassword);
    setShowMaxParticipantsError(hasSettingsValidationError);

    if (
      needsPassword ||
      isSubmitting ||
      hasThumbnailBlockingError ||
      hasSelectedThumbnailWithoutToken
    ) {
      const message = needsPassword
        ? "방 비밀번호를 입력해 주세요."
        : thumbnailSelection.errorMessage ||
          thumbnailUploadErrorMessage ||
          "썸네일 업로드가 끝날 때까지 기다려 주세요.";
      notify({
        dedupeKey: needsPassword
          ? "room-create:password"
          : "room-create:thumbnail",
        message,
        tone: "error",
      });
      return;
    }

    if (hasSettingsValidationError) {
      notify({
        dedupeKey: "room-create:max-participants",
        message: maxParticipantsError || "최대 인원을 선택해 주세요.",
        tone: "error",
      });
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

      notify({
        dedupeKey: `room-create:${normalizeRoomSlug(result.slug)}`,
        message: `'${trimmedTitle}' 방을 만들었습니다!`,
        tone: "default",
      });
      navigateToRoom(result.slug, createdRoomPassword);
    } catch (error) {
      setIsNavigatingToCreatedRoom(false);
      notify({
        dedupeKey: "room-create:submit",
        message:
          error instanceof Error && error.message
            ? error.message
            : "방을 만들지 못했습니다.",
        tone: "error",
      });
    }
  };

  const handleThumbnailChange = (files: FileList | null) => {
    uploadTemporaryRoomThumbnailMutation.reset();
    const selectedFile = thumbnailSelection.selectFile(files);

    if (selectedFile) {
      uploadTemporaryRoomThumbnailMutation.mutate(
        { file: selectedFile },
        {
          onError: (error) => {
            notify({
              dedupeKey: "room-create:thumbnail",
              message: error.message || "썸네일을 업로드하지 못했습니다.",
              tone: "error",
            });
          },
        },
      );
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
          titleInvalid={showTitleError}
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
          onTitleChange={(nextTitle) => {
            setTitle(nextTitle.slice(0, ROOM_TITLE_MAX_LENGTH));
            setShowTitleError(false);
          }}
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
          showMaxParticipantsError ? maxParticipantsError : null
        }
        showPasswordError={showPasswordError && needsPassword}
        onMaxParticipantsChange={(nextValue) => {
          setMaxParticipants(nextValue);
          setShowMaxParticipantsError(false);
        }}
        onParticipationModeChange={(mode) => {
          setParticipationMode(mode);
          setShowPasswordError(false);
        }}
        onPasswordChange={(nextPassword) => {
          setPassword(nextPassword);
          setShowPasswordError(false);
        }}
        onTrackLimitMinutesChange={(nextValue) => {
          setTrackLimitMinutes(nextValue);
        }}
        trackLimitMinuteOptions={ROOM_TRACK_LIMIT_MINUTE_OPTIONS}
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
                  disabled={isSubmitting}
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
