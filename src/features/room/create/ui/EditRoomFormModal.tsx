"use client";

import { useEditRoomForm } from "@/src/features/room/update/hooks/useEditRoomForm";
import { useRoomTags } from "@/src/features/room/hooks/useRoomTags";
import QueryBoundary from "@/src/shared/ui/query-boundary/QueryBoundary";
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

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-edit-modal-title"
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="모달 닫기"
        >
          <span className={styles.closeIcon} aria-hidden="true" />
        </button>

        <form className={styles.form} onSubmit={form.handleSubmit}>
          <h2 id="room-edit-modal-title" className={styles.modeBadge}>
            EDIT
          </h2>

          <RoomThumbnailUploadField
            actionLabel="THUMBNAIL"
            currentImageUrl={initialThumbnailUrl}
            disabled={form.isSubmitting}
            errorMessage={form.thumbnailErrorMessage}
            fileName={form.thumbnailFileName}
            inputId="edit-room-thumbnail"
            isPreviewUnavailable={form.isThumbnailPreviewUnavailable}
            previewUrl={form.thumbnailPreviewUrl}
            variant="edit"
            onClearSelection={form.clearThumbnailSelection}
            onFileChange={form.updateThumbnailFiles}
            onPreviewError={form.onThumbnailPreviewError}
          />

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
              <span className={styles.limitHint}>
                최대 {form.maxParticipantsLimit}명
              </span>
            </div>
            <div className={styles.limitControlGroup}>
              <input
                id="edit-room-max-participants"
                className={styles.numberInput}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={3}
                value={form.maxParticipants}
                onChange={(event) =>
                  form.updateMaxParticipants(event.target.value)
                }
                placeholder="제한 없음"
                disabled={form.isSubmitting}
                aria-invalid={Boolean(form.maxParticipantsError)}
                aria-describedby={
                  form.maxParticipantsError
                    ? "edit-room-max-participants-error"
                    : undefined
                }
                data-invalid={Boolean(form.maxParticipantsError)}
              />
              <button
                type="button"
                className={styles.unlimitedButton}
                onClick={form.clearMaxParticipants}
                disabled={form.isSubmitting || form.maxParticipants.length === 0}
              >
                제한 없음
              </button>
            </div>
            {form.maxParticipantsError ? (
              <p
                id="edit-room-max-participants-error"
                className={styles.errorText}
              >
                {form.maxParticipantsError}
              </p>
            ) : null}
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
                <div className={styles.helperText}>장르 불러오는 중...</div>
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
              수정 실패: ({form.submitError.status}) {form.submitError.message}
            </p>
          ) : null}
          {form.thumbnailSubmitError ? (
            <p className={styles.errorText}>
              썸네일 업로드 실패: ({form.thumbnailSubmitError.status}){" "}
              {form.thumbnailSubmitError.message}
            </p>
          ) : null}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={!form.canSubmit}
          >
            {form.isSubmitting ? "큐 수정 중..." : "큐 수정하기"}
          </button>
        </form>
      </div>
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
