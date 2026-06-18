"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import { useRoomTags } from "@/src/features/room/hooks/useRoomTags";
import { useCreateRoom } from "@/src/features/room/create/model/useCreateRoom";
import { useRoomThumbnailSelection } from "@/src/features/room/hooks/useRoomThumbnailSelection";
import { useUploadRoomThumbnail } from "@/src/features/room/hooks/useUploadRoomThumbnail";
import { useDeleteRoom } from "@/src/features/room/hooks/useDeleteRoom";
import { writeStoredRoomJoinPassword } from "@/src/features/room/join/lib/roomJoinPasswordStorage";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import QueryBoundary from "@/src/shared/ui/query-boundary/QueryBoundary";
import CreateBasicInfoStep from "./CreateBasicInfoStep";
import CreateGenreStep from "./CreateGenreStep";
import CreateSettingsStep, {
  type ParticipationMode,
} from "./CreateSettingsStep";
import EditRoomFormModal from "./EditRoomFormModal";
import styles from "./RoomFormModal.module.css";

const MAX_TAGS = 5;
const MAX_ROOM_TITLE_LENGTH = 18;
const EMPTY_TAG_SLUGS: string[] = [];

type RoomFormModalMode = "create" | "edit";

type RoomFormModalProps = {
  open: boolean;
  mode: RoomFormModalMode;
  roomSlug?: string;
  initialTitle?: string;
  initialTagSlugs?: string[];
  initialHasPassword?: boolean;
  initialThumbnailUrl?: string | null;
  onClose: () => void;
};

const createSteps = [
  { label: "기본 정보", title: "기본 정보" },
  { label: "장르 선택", title: "장르 선택" },
  { label: "세부 설정", title: "세부 설정" },
] as const;

export default function RoomFormModal({
  open,
  mode,
  roomSlug,
  initialTitle = "",
  initialTagSlugs = EMPTY_TAG_SLUGS,
  initialHasPassword = false,
  initialThumbnailUrl = null,
  onClose,
}: RoomFormModalProps) {
  if (!open) {
    return null;
  }

  if (mode === "edit") {
    return (
      <EditRoomFormModal
        open={open}
        roomSlug={roomSlug}
        initialTitle={initialTitle}
        initialTagSlugs={initialTagSlugs}
        initialHasPassword={initialHasPassword}
        initialThumbnailUrl={initialThumbnailUrl}
        onClose={onClose}
      />
    );
  }

  return <CreateRoomFormModal onClose={onClose} />;
}

type CreateRoomFormModalProps = {
  onClose: () => void;
};

function CreateRoomFormModal({ onClose }: CreateRoomFormModalProps) {
  const router = useRouter();
  const createRoomMutation = useCreateRoom();
  const uploadRoomThumbnailMutation = useUploadRoomThumbnail();
  const deleteCreatedRoomMutation = useDeleteRoom();
  const thumbnailSelection = useRoomThumbnailSelection();
  const [currentStep, setCurrentStep] = useState(0);
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [participationMode, setParticipationMode] =
    useState<ParticipationMode>("public");
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);
  const [didTryFinish, setDidTryFinish] = useState(false);
  const [isNavigatingToCreatedRoom, setIsNavigatingToCreatedRoom] =
    useState(false);

  const trimmedTitle = title.trim();
  const trimmedPassword = password.trim();
  const isSubmitting =
    createRoomMutation.isPending ||
    uploadRoomThumbnailMutation.isPending ||
    deleteCreatedRoomMutation.isPending ||
    isNavigatingToCreatedRoom;
  const needsPassword =
    participationMode === "password" && trimmedPassword.length === 0;
  const thumbnailUploadErrorMessage = uploadRoomThumbnailMutation.error
    ? [
        "썸네일 업로드 실패:",
        `(${uploadRoomThumbnailMutation.error.status})`,
        uploadRoomThumbnailMutation.error.message,
      ].join(" ")
    : null;
  const hasThumbnailBlockingError = Boolean(
    thumbnailSelection.errorMessage || thumbnailUploadErrorMessage,
  );
  const canGoNext =
    currentStep === 0
      ? trimmedTitle.length > 0 && !isSubmitting && !hasThumbnailBlockingError
      : !isSubmitting;
  const stepTitle = createSteps[currentStep].title;

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

  const goToPreviousStep = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const goToNextStep = () => {
    if (!canGoNext) {
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, createSteps.length - 1));
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

  const uploadThumbnailAndNavigate = async (
    slug: string,
    roomPassword?: string,
  ) => {
    if (!thumbnailSelection.file) {
      navigateToRoom(slug, roomPassword);
      return;
    }

    try {
      uploadRoomThumbnailMutation.reset();
      await uploadRoomThumbnailMutation.mutateAsync({
        slug,
        file: thumbnailSelection.file,
      });
      navigateToRoom(slug, roomPassword);
    } catch {
      setCurrentStep(0);

      try {
        await deleteCreatedRoomMutation.mutateAsync(slug);
      } catch {
        // The delete mutation error is rendered below so the user knows rollback failed.
      }
    }
  };

  const finishCreateRoom = async () => {
    setDidTryFinish(true);

    if (!trimmedTitle) {
      setCurrentStep(0);
      return;
    }

    if (needsPassword || isSubmitting || hasThumbnailBlockingError) {
      return;
    }

    try {
      const createdRoomPassword =
        participationMode === "password" && trimmedPassword
          ? trimmedPassword
          : undefined;
      const result = await createRoomMutation.mutateAsync({
        title: trimmedTitle,
        password: createdRoomPassword,
        tags: selectedTagSlugs,
      });

      await uploadThumbnailAndNavigate(result.slug, createdRoomPassword);
    } catch {
      setIsNavigatingToCreatedRoom(false);
    }
  };

  const handleThumbnailChange = (files: FileList | null) => {
    uploadRoomThumbnailMutation.reset();
    deleteCreatedRoomMutation.reset();
    thumbnailSelection.selectFile(files);
  };

  const handleThumbnailClear = () => {
    uploadRoomThumbnailMutation.reset();
    deleteCreatedRoomMutation.reset();
    thumbnailSelection.clearSelection();
  };

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <CreateBasicInfoStep
          title={title}
          maxTitleLength={MAX_ROOM_TITLE_LENGTH}
          disabled={isSubmitting}
          thumbnailErrorMessage={
            thumbnailSelection.errorMessage ?? thumbnailUploadErrorMessage
          }
          thumbnailFileName={thumbnailSelection.fileName}
          thumbnailPreviewUrl={thumbnailSelection.previewUrl}
          isThumbnailPreviewUnavailable={
            thumbnailSelection.isPreviewUnavailable
          }
          onTitleChange={(nextTitle) =>
            setTitle(nextTitle.slice(0, MAX_ROOM_TITLE_LENGTH))
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
          fallback={<div className={styles.stepState}>장르 불러오는 중...</div>}
          errorTitle="장르를 불러오지 못했어요."
          errorDescription="다시 시도해 주세요."
        >
          <CreateGenreStepContent
            selectedTagSlugs={selectedTagSlugs}
            maxTags={MAX_TAGS}
            disabled={isSubmitting}
            onToggleTag={toggleTag}
          />
        </QueryBoundary>
      );
    }

    return (
      <CreateSettingsStep
        participationMode={participationMode}
        password={password}
        disabled={isSubmitting}
        showPasswordError={didTryFinish && needsPassword}
        onParticipationModeChange={(mode) => {
          setParticipationMode(mode);
          setDidTryFinish(false);

          if (mode === "public") {
            setPassword("");
          }
        }}
        onPasswordChange={(nextPassword) => {
          setPassword(nextPassword);
          setDidTryFinish(false);
        }}
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
                const isCompleted = index < currentStep;
                const isReachable = index <= currentStep;

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
                        isSubmitting ||
                        hasThumbnailBlockingError
                      }
                      onClick={() => setCurrentStep(index)}
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
                  {selectedTagSlugs.length}/{MAX_TAGS}
                </span>
              ) : null}
            </div>

            <div className={styles.stepBody}>{renderStepContent()}</div>

            {createRoomMutation.error ? (
              <p className={styles.errorText}>
                생성 실패: ({createRoomMutation.error.status}){" "}
                {createRoomMutation.error.message}
              </p>
            ) : null}
            {deleteCreatedRoomMutation.error ? (
              <p className={styles.errorText} role="alert">
                썸네일 업로드 실패 후 생성된 방 정리에 실패했습니다: (
                {deleteCreatedRoomMutation.error.status}){" "}
                {deleteCreatedRoomMutation.error.message}
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
                    <ClipLoader
                      aria-label="방 생성 중"
                      color="#ffffff"
                      loading
                      size={18}
                      speedMultiplier={0.9}
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
  maxTags: number;
  selectedTagSlugs: string[];
  onToggleTag: (slug: string) => void;
};

function CreateGenreStepContent({
  disabled,
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
      onToggleTag={onToggleTag}
    />
  );
}
