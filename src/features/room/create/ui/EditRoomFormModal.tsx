"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditRoomForm } from "@/src/features/room/update/hooks/useEditRoomForm";
import { useDeleteRoom } from "@/src/features/room/update/model/useDeleteRoom";
import { useRoomTags } from "@/src/features/room/hooks/useRoomTags";
import QueryBoundary from "@/src/shared/ui/query-boundary/QueryBoundary";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import RoomActionConfirmDialog from "@/src/features/room/management/ui/RoomActionConfirmDialog";
import RoomThumbnailUploadField from "./RoomThumbnailUploadField";
import styles from "./EditRoomFormModal.module.css";

const EMPTY_TAG_SLUGS: string[] = [];

type EditRoomFormModalProps = {
  open: boolean;
  roomSlug?: string;
  initialTitle?: string;
  initialTagSlugs?: string[];
  initialHasPassword?: boolean;
  initialMaxParticipants?: number | null;
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
  initialThumbnailUrl = null,
  onClose,
}: EditRoomFormModalProps) {
  const router = useRouter();
  const deleteRoomMutation = useDeleteRoom();
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const form = useEditRoomForm({
    initialHasPassword,
    initialMaxParticipants,
    initialTagSlugs,
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
      onClose();
      router.replace("/");
    } catch {
      // The confirmation dialog keeps the API error visible for retry.
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
          <div className={styles.formHeader}>
            <h2 id="room-edit-modal-title" className={styles.modeBadge}>
              EDIT
            </h2>
            <button
              ref={deleteButtonRef}
              type="button"
              className={styles.deleteRoomButton}
              disabled={!roomSlug || form.isSubmitting}
              onClick={() => {
                deleteRoomMutation.reset();
                setIsDeleteDialogOpen(true);
              }}
            >
              큐 삭제
            </button>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>썸네일</span>
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
          </div>

          <label className={styles.field}>
            <span className={styles.label}>큐 이름</span>
            <input
              className={styles.input}
              value={form.title}
              onChange={(event) => form.updateTitle(event.target.value)}
              maxLength={form.maxRoomTitleLength}
              placeholder="작업 효율 200% 높여주는 노래"
              disabled={form.isSubmitting}
            />
          </label>

          <div className={styles.field}>
            <div className={styles.passwordActionRow}>
              <button
                type="button"
                className={styles.checkboxRow}
                role="checkbox"
                aria-checked={form.isPasswordChangeEnabled}
                onClick={() =>
                  form.updatePasswordChangeEnabled(
                    !form.isPasswordChangeEnabled,
                  )
                }
                disabled={form.isSubmitting || form.isPasswordClearEnabled}
              >
                <span
                  className={styles.checkboxBox}
                  data-checked={form.isPasswordChangeEnabled}
                  aria-hidden="true"
                />
                <span className={styles.label}>
                  {initialHasPassword ? "새 비밀번호로 변경" : "비밀번호 설정"}
                </span>
              </button>

              {initialHasPassword ? (
                <button
                  type="button"
                  className={styles.checkboxRow}
                  role="checkbox"
                  aria-checked={form.isPasswordClearEnabled}
                  onClick={() =>
                    form.updatePasswordClearEnabled(
                      !form.isPasswordClearEnabled,
                    )
                  }
                  disabled={form.isSubmitting}
                >
                  <span
                    className={styles.checkboxBox}
                    data-checked={form.isPasswordClearEnabled}
                    aria-hidden="true"
                  />
                  <span className={styles.label}>비밀번호 해제</span>
                </button>
              ) : null}
            </div>

            {form.isPasswordChangeEnabled ? (
              <input
                className={styles.input}
                type="password"
                value={form.password}
                onChange={(event) => form.setPassword(event.target.value)}
                maxLength={255}
                placeholder={
                  initialHasPassword
                    ? "새 비밀번호를 입력하세요"
                    : "비밀번호를 입력하세요"
                }
                disabled={form.isSubmitting}
              />
            ) : null}
            {form.isPasswordClearEnabled ? (
              <span className={styles.helperText}>
                저장하면 비밀번호 없이 입장할 수 있습니다.
              </span>
            ) : initialHasPassword ? (
              <span className={styles.helperText}>
                변경하지 않으면 기존 비밀번호가 유지됩니다.
              </span>
            ) : null}
            {form.isPasswordRequired ? (
              <span className={styles.errorText}>
                새 비밀번호를 입력해주세요.
              </span>
            ) : null}
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label
                className={styles.label}
                htmlFor="edit-room-max-participants"
              >
                최대 인원 수
              </label>
            </div>
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

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <span className={styles.label}>큐 장르</span>
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
          </div>

          {form.submitError ? (
            <p className={styles.errorText}>
              {form.submitErrorPrefix}: {form.submitError.message}
            </p>
          ) : null}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={!form.canSubmit}
          >
            {form.isSubmitting ? (
              <LoadingSpinner
                ariaLabel="큐 수정 중"
                color="#ffffff"
                size={16}
              />
            ) : (
              "큐 수정하기"
            )}
          </button>
          </form>
        </div>
      </div>
      <RoomActionConfirmDialog
        confirmLabel="큐 삭제하기"
        description={
          <>
            해당 큐를 삭제하시겠어요?
            <br />
            전체 트랙이 삭제되고 기록을 복원할 수 없으며,
            <br />
            다른 사용자들도 모두 내보내기 처리됩니다.
          </>
        }
        errorMessage={deleteRoomMutation.error?.message}
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
