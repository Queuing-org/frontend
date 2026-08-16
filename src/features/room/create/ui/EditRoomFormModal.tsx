"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { useEditRoomForm } from "@/src/features/room/update/hooks/useEditRoomForm";
import { useDeleteRoom } from "@/src/features/room/update/model/useDeleteRoom";
import { useRoomTags } from "@/src/features/room/hooks/useRoomTags";
import QueryBoundary from "@/src/shared/ui/query-boundary/QueryBoundary";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import RoomActionConfirmDialog from "@/src/features/room/management/ui/RoomActionConfirmDialog";
import RoomThumbnailUploadField from "./RoomThumbnailUploadField";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";
import styles from "./EditRoomFormModal.module.css";

const EMPTY_TAG_SLUGS: string[] = [];
type EditParticipationMode = "public" | "password";

type EditRoomFormModalProps = {
  open: boolean;
  roomSlug?: string;
  initialTitle?: string;
  initialTagSlugs?: string[];
  initialHasPassword?: boolean;
  initialMaxParticipants?: number | null;
  initialTrackLimitMinutes?: number | null;
  initialThumbnailUrl?: string | null;
  onClose: () => void;
};

export default function EditRoomFormModal({
  open,
  roomSlug,
  initialTitle = "",
  initialTagSlugs = EMPTY_TAG_SLUGS,
  initialHasPassword = false,
  initialMaxParticipants = null,
  initialTrackLimitMinutes = null,
  initialThumbnailUrl = null,
  onClose,
}: EditRoomFormModalProps) {
  const router = useRouter();
  const { notify } = useActionFeedback();
  const deleteRoomMutation = useDeleteRoom();
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const form = useEditRoomForm({
    initialHasPassword,
    initialMaxParticipants,
    initialTagSlugs,
    initialTrackLimitMinutes,
    initialTitle,
    onClose,
    roomSlug,
  });

  if (!open) {
    return null;
  }

  const hasLegacyMaxParticipants =
    typeof initialMaxParticipants === "number" &&
    !(form.maxParticipantOptions as readonly number[]).includes(
      initialMaxParticipants,
    );
  const hasLegacyTrackLimitMinutes =
    typeof initialTrackLimitMinutes === "number" &&
    !(form.trackLimitMinuteOptions as readonly number[]).includes(
      initialTrackLimitMinutes,
    );
  const participationMode: EditParticipationMode =
    form.isPasswordClearEnabled
      ? "public"
      : initialHasPassword || form.isPasswordChangeEnabled
        ? "password"
        : "public";

  const updateParticipationMode = (mode: EditParticipationMode) => {
    if (mode === participationMode) {
      return;
    }

    if (mode === "public") {
      form.updatePasswordChangeEnabled(false);
      form.updatePasswordClearEnabled(initialHasPassword);
      return;
    }

    form.updatePasswordClearEnabled(false);
    form.updatePasswordChangeEnabled(!initialHasPassword);
  };

  const updateParticipationPassword = (value: string) => {
    if (!form.isPasswordChangeEnabled) {
      form.updatePasswordChangeEnabled(true);
    }
    form.setPassword(value);
  };

  const closeDeleteDialog = () => {
    if (deleteRoomMutation.isPending) {
      return;
    }

    setIsDeleteDialogOpen(false);
    deleteRoomMutation.reset();
    requestAnimationFrame(() => deleteButtonRef.current?.focus());
  };

  const handleDeleteRoom = async () => {
    if (!roomSlug || deleteRoomMutation.isPending) {
      return;
    }

    try {
      await deleteRoomMutation.mutateAsync({ slug: roomSlug });
      notify({
        dedupeKey: `room-delete:${roomSlug}`,
        message: `'${initialTitle}' 방을 삭제했습니다.`,
        tone: "default",
      });
      onClose();
      router.replace("/");
    } catch (error) {
      notify({
        dedupeKey: `room-delete:${roomSlug}`,
        message:
          error instanceof Error && error.message
            ? error.message
            : "방을 삭제하지 못했습니다.",
        tone: "error",
      });
    }
  };

  return (
    <>
      <div
        className={styles.overlay}
        onClick={deleteRoomMutation.isPending ? undefined : onClose}
        role="presentation"
      >
        <div
          className={styles.modal}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="room-edit-modal-title"
          inert={isDeleteDialogOpen ? true : undefined}
        >
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={deleteRoomMutation.isPending}
            aria-label="모달 닫기"
          >
            <span className={styles.closeIcon} aria-hidden="true" />
          </button>

          <form className={styles.form} onSubmit={form.handleSubmit}>
            <header className={styles.formHeader}>
              <h2 id="room-edit-modal-title" className={styles.modeBadge}>
                EDIT
              </h2>
            </header>

            <div className={styles.formBody}>
            <section className={styles.thumbnailSection}>
              <span className={styles.visuallyHidden}>썸네일</span>
              <RoomThumbnailUploadField
                actionLabel="썸네일 교체"
                currentImageUrl={initialThumbnailUrl}
                disabled={form.isSubmitting}
                errorMessage={form.thumbnailErrorMessage}
                fileName={form.thumbnailFileName}
                inputId="edit-room-thumbnail"
                isPreviewUnavailable={form.isThumbnailPreviewUnavailable}
                previewUrl={form.thumbnailPreviewUrl}
                statusMessage={
                  form.thumbnailStatusMessage ? (
                    <LoadingSpinner
                      announce={false}
                      ariaLabel="썸네일 업로드 중"
                      size={14}
                    />
                  ) : null
                }
                statusAriaLabel={
                  form.thumbnailStatusMessage
                    ? "썸네일 업로드 중"
                    : undefined
                }
                variant="edit"
                onClearSelection={form.clearThumbnailSelection}
                onFileChange={form.handleThumbnailChange}
                onPreviewError={form.markThumbnailPreviewUnavailable}
              />
            </section>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="edit-room-title">
                큐 이름
              </label>
              <span className={styles.titleControl}>
                <input
                  id="edit-room-title"
                  className={styles.titleInput}
                  value={form.title}
                  onChange={(event) => form.updateTitle(event.target.value)}
                  maxLength={form.maxRoomTitleLength}
                  placeholder="작업 효율 200% 높여주는 노래"
                  disabled={form.isSubmitting}
                  aria-invalid={form.titleInvalid}
                  aria-describedby={
                    form.titleInvalid ? "edit-room-title-error" : undefined
                  }
                />
                {form.title ? (
                  <button
                    type="button"
                    className={styles.titleClearButton}
                    aria-label="큐 이름 지우기"
                    disabled={form.isSubmitting}
                    onClick={() => form.updateTitle("")}
                  >
                    <XCircle aria-hidden="true" size={20} />
                  </button>
                ) : null}
              </span>
              <span
                id="edit-room-title-error"
                className={styles.visuallyHidden}
              >
                방 제목을 입력해 주세요.
              </span>
            </div>

            <fieldset
              className={styles.field}
              aria-labelledby="edit-room-tags-label"
              aria-invalid={form.tagsInvalid}
              aria-describedby={
                form.tagsInvalid ? "edit-room-tags-error" : undefined
              }
            >
              <div className={styles.labelRow}>
                <span id="edit-room-tags-label" className={styles.label}>
                  큐 장르
                </span>
                <span className={styles.helperText}>
                  {form.selectedTagSlugs.length}/{form.maxTags}
                </span>
              </div>
              <QueryBoundary
                fallback={
                  <div className={styles.helperText}>
                    <LoadingSpinner ariaLabel="장르 로딩 중" size={18} />
                  </div>
                }
                errorTitle="장르를 불러오지 못했어요."
                errorDescription="다시 시도해 주세요."
              >
                <EditRoomTagsField
                  disabled={form.isSubmitting}
                  maxTags={form.maxTags}
                  selectedTagSlugs={form.selectedTagSlugs}
                  onToggleTag={form.toggleTag}
                />
              </QueryBoundary>
              <span
                id="edit-room-tags-error"
                className={styles.visuallyHidden}
              >
                장르를 하나 이상 선택해 주세요.
              </span>
            </fieldset>

            <div className={styles.settingsStack}>
              <div className={styles.settingRow}>
                <label
                  className={styles.settingLabel}
                  htmlFor="edit-room-track-limit"
                >
                  곡 당 제한 시간
                </label>
                <select
                  id="edit-room-track-limit"
                  className={styles.select}
                  value={form.trackLimitMinutes}
                  onChange={(event) =>
                    form.updateTrackLimitMinutes(event.target.value)
                  }
                  disabled={form.isSubmitting}
                >
                  <option value="">제한 없음</option>
                  {hasLegacyTrackLimitMinutes ? (
                    <option value={String(initialTrackLimitMinutes)}>
                      {initialTrackLimitMinutes}분 (현재 설정)
                    </option>
                  ) : null}
                  {form.trackLimitMinuteOptions.map((option) => (
                    <option key={option} value={String(option)}>
                      {option}분
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.settingRow}>
                <label
                  className={styles.settingLabel}
                  htmlFor="edit-room-max-participants"
                >
                  최대 인원 수
                </label>
                <select
                  id="edit-room-max-participants"
                  className={styles.select}
                  value={form.maxParticipants}
                  onChange={(event) =>
                    form.updateMaxParticipants(event.target.value)
                  }
                  disabled={form.isSubmitting}
                >
                  {initialMaxParticipants == null ? (
                    <option value="">제한 없음 (현재 설정)</option>
                  ) : null}
                  {hasLegacyMaxParticipants ? (
                    <option value={String(initialMaxParticipants)}>
                      {initialMaxParticipants}명 (현재 설정)
                    </option>
                  ) : null}
                  {form.maxParticipantOptions.map((option) => (
                    <option key={option} value={String(option)}>
                      {option}명
                    </option>
                  ))}
                </select>
              </div>

              <div
                className={`${styles.settingRow} ${styles.participationSettingRow}`}
              >
                <label
                  className={styles.settingLabel}
                  htmlFor="edit-room-participation"
                >
                  참여 제한
                </label>
                <EditParticipationControl
                  disabled={form.isSubmitting}
                  errorMessage={
                    form.passwordInvalid
                      ? "새 비밀번호를 입력해주세요."
                      : null
                  }
                  helperText={
                    participationMode === "public"
                      ? initialHasPassword
                        ? "저장하면 비밀번호 없이 입장할 수 있습니다."
                        : null
                      : initialHasPassword && !form.isPasswordChangeEnabled
                        ? "입력하지 않으면 기존 비밀번호가 유지됩니다."
                        : null
                  }
                  mode={participationMode}
                  password={form.password}
                  passwordPlaceholder={
                    initialHasPassword
                      ? "새 비밀번호 입력 (비워두면 기존 비밀번호 유지)"
                      : "비밀번호 입력"
                  }
                  onModeChange={updateParticipationMode}
                  onPasswordChange={updateParticipationPassword}
                />
              </div>
            </div>

            </div>

            <footer className={styles.formFooter}>
              <button
                ref={deleteButtonRef}
                type="button"
                className={`${styles.footerButton} ${styles.deleteRoomButton}`}
                disabled={!roomSlug || form.isSubmitting}
                onClick={() => {
                  deleteRoomMutation.reset();
                  setIsDeleteDialogOpen(true);
                }}
              >
                방 삭제
              </button>
              <button
                type="submit"
                className={`${styles.footerButton} ${styles.submitButton}`}
                disabled={!form.canSubmit}
              >
                {form.isSubmitting ? (
                  <LoadingSpinner
                    ariaLabel="큐 수정 중"
                    color="#ffffff"
                    size={16}
                  />
                ) : (
                  "편집 완료"
                )}
              </button>
            </footer>
          </form>
        </div>
      </div>
      <RoomActionConfirmDialog
        confirmLabel="방 삭제하기"
        description={
          <>
            해당 방을 삭제하시겠어요?
            <br />
            전체 트랙이 삭제되고 기록을 복원할 수 없으며,
            <br />
            다른 사용자들도 모두 내보내기 처리됩니다.
          </>
        }
        isPending={deleteRoomMutation.isPending}
        open={isDeleteDialogOpen}
        title={initialTitle}
        onCancel={closeDeleteDialog}
        onConfirm={() => {
          void handleDeleteRoom();
        }}
      />
    </>
  );
}

type EditParticipationControlProps = {
  disabled: boolean;
  errorMessage: string | null;
  helperText: string | null;
  mode: EditParticipationMode;
  password: string;
  passwordPlaceholder: string;
  onModeChange: (mode: EditParticipationMode) => void;
  onPasswordChange: (value: string) => void;
};

function EditParticipationControl({
  disabled,
  errorMessage,
  helperText,
  mode,
  password,
  passwordPlaceholder,
  onModeChange,
  onPasswordChange,
}: EditParticipationControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const controlRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const focusAfterCloseRef = useRef<"password" | "toggle" | null>(null);
  const isPasswordMode = mode === "password";
  const errorId = "edit-room-participation-error";
  const helperId = "edit-room-participation-helper";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !controlRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      setIsOpen(false);
      focusAfterCloseRef.current = isPasswordMode ? "password" : "toggle";
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isPasswordMode]);

  useEffect(() => {
    if (isOpen || focusAfterCloseRef.current === null) {
      return;
    }

    if (focusAfterCloseRef.current === "password" && isPasswordMode) {
      passwordInputRef.current?.focus();
    } else {
      toggleRef.current?.focus();
    }
    focusAfterCloseRef.current = null;
  }, [isOpen, isPasswordMode]);

  const selectMode = (nextMode: EditParticipationMode) => {
    focusAfterCloseRef.current =
      nextMode === "password" ? "password" : "toggle";
    onModeChange(nextMode);
    setIsOpen(false);
  };

  const handleControlClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }

    const target = event.target;
    if (
      target instanceof Element &&
      target.closest(`.${styles.participationOption}`)
    ) {
      return;
    }

    setIsOpen((current) => !current);
  };

  return (
    <div className={styles.participationColumn}>
      <div
        ref={controlRef}
        className={styles.participationControl}
        onClick={handleControlClick}
      >
        {isPasswordMode ? (
          <input
            ref={passwordInputRef}
            id="edit-room-participation"
            className={styles.participationInput}
            data-invalid={Boolean(errorMessage)}
            type="password"
            value={password}
            maxLength={255}
            placeholder={passwordPlaceholder}
            disabled={disabled}
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={
              errorMessage ? errorId : helperText ? helperId : undefined
            }
            onChange={(event) => onPasswordChange(event.target.value)}
          />
        ) : (
          <input
            id="edit-room-participation"
            className={`${styles.participationInput} ${styles.participationValue}`}
            type="text"
            value="누구나 참여"
            readOnly
            disabled={disabled}
            aria-describedby={helperText ? helperId : undefined}
          />
        )}
        <button
          ref={toggleRef}
          type="button"
          className={styles.participationToggle}
          disabled={disabled}
          aria-label="참여 제한 옵션 열기"
          aria-expanded={isOpen}
          aria-controls="edit-room-participation-options"
        >
          <span
            className={styles.participationChevron}
            data-open={isOpen}
            aria-hidden="true"
          />
        </button>
        {isOpen ? (
          <div
            id="edit-room-participation-options"
            className={styles.participationMenu}
            role="group"
            aria-label="참여 제한 옵션"
          >
            <button
              type="button"
              className={styles.participationOption}
              aria-pressed={mode === "public"}
              onClick={() => selectMode("public")}
            >
              누구나 참여
            </button>
            <button
              type="button"
              className={styles.participationOption}
              aria-pressed={mode === "password"}
              onClick={() => selectMode("password")}
            >
              비밀번호 입력
            </button>
          </div>
        ) : null}
      </div>
      {errorMessage ? (
        <p id={errorId} className={styles.visuallyHidden}>
          {errorMessage}
        </p>
      ) : helperText ? (
        <p id={helperId} className={styles.helperText}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

type EditRoomTagsFieldProps = {
  disabled: boolean;
  maxTags: number;
  selectedTagSlugs: string[];
  onToggleTag: (slug: string) => void;
};

function EditRoomTagsField({
  disabled,
  maxTags,
  selectedTagSlugs,
  onToggleTag,
}: EditRoomTagsFieldProps) {
  const { data: roomTags } = useRoomTags();

  return (
    <div className={styles.tagGrid}>
      {roomTags.map((tag) => {
        const selected = selectedTagSlugs.includes(tag.slug);
        const tagDisabled = !selected && selectedTagSlugs.length >= maxTags;

        return (
          <button
            key={tag.slug}
            type="button"
            className={styles.tagChip}
            data-selected={selected}
            disabled={disabled || tagDisabled}
            onClick={() => onToggleTag(tag.slug)}
          >
            {tag.name}
          </button>
        );
      })}
      {roomTags.length === 0 ? (
        <span className={styles.helperText}>장르가 없습니다.</span>
      ) : null}
    </div>
  );
}
