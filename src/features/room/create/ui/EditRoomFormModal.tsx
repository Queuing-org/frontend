"use client";

import { useState, type FormEvent } from "react";
import type { UpdateRoomPayload } from "@/src/entities/room/api/types";
import { useRoomTags } from "@/src/entities/room/hooks/useRoomTags";
import { useUpdateRoom } from "@/src/features/room/update/model/useUpdateRoom";
import styles from "./EditRoomFormModal.module.css";

const MAX_TAGS = 5;
const MAX_ROOM_TITLE_LENGTH = 18;
const DEFAULT_MAX_USERS = "100";
const DEFAULT_TRACK_LIMIT_MINUTES = "5";
const EMPTY_TAG_SLUGS: string[] = [];

function haveSameItems(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  const rightItems = new Set(right);

  return left.every((item) => rightItems.has(item));
}

type EditRoomFormModalProps = {
  open: boolean;
  roomSlug?: string;
  initialTitle?: string;
  initialTagSlugs?: string[];
  initialHasPassword?: boolean;
  onClose: () => void;
};

export default function EditRoomFormModal({
  open,
  roomSlug,
  initialTitle = "",
  initialTagSlugs = EMPTY_TAG_SLUGS,
  initialHasPassword = false,
  onClose,
}: EditRoomFormModalProps) {
  const updateRoomMutation = useUpdateRoom();
  const {
    data: roomTags,
    isLoading: tagsLoading,
    isError: tagsError,
  } = useRoomTags();
  const [title, setTitle] = useState(() => initialTitle);
  const [password, setPassword] = useState("");
  const [isPasswordEnabled, setIsPasswordEnabled] = useState(
    () => initialHasPassword,
  );
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>(() =>
    initialTagSlugs.slice(0, MAX_TAGS),
  );
  const [maxUsers, setMaxUsers] = useState(() => DEFAULT_MAX_USERS);
  const [trackLimitMinutes, setTrackLimitMinutes] = useState(
    () => DEFAULT_TRACK_LIMIT_MINUTES,
  );

  if (!open) {
    return null;
  }

  const isSubmitting = updateRoomMutation.isPending;
  const submitError = updateRoomMutation.error;
  const tags = roomTags ?? [];
  const trimmedTitle = title.trim();
  const trimmedPassword = password.trim();
  const isPasswordRequired =
    isPasswordEnabled && trimmedPassword.length === 0 && !initialHasPassword;
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trimmedTitle || isPasswordRequired || !roomSlug) {
      return;
    }

    const updatePayload: UpdateRoomPayload = {};

    if (trimmedTitle !== initialTitle.trim()) {
      updatePayload.title = trimmedTitle;
    }

    if (!haveSameItems(selectedTagSlugs, initialTagSlugs)) {
      updatePayload.tags = selectedTagSlugs;
    }

    if (isPasswordEnabled && trimmedPassword) {
      updatePayload.password = trimmedPassword;
    }

    if (Object.keys(updatePayload).length === 0) {
      onClose();
      return;
    }

    updateRoomMutation.mutate(
      {
        slug: roomSlug,
        payload: updatePayload,
      },
      {
        onSuccess: onClose,
      },
    );
  };

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

        <form className={styles.form} onSubmit={handleSubmit}>
          <h2 id="room-edit-modal-title" className={styles.modeBadge}>
            EDIT
          </h2>

          <button
            type="button"
            className={styles.thumbnailButton}
            aria-label="방 썸네일 선택"
          >
            <span className={styles.cameraIcon} aria-hidden="true" />
            <span className={styles.thumbnailText}>THUMBNAIL</span>
          </button>

          <label className={styles.field}>
            <span className={styles.label}>큐 이름</span>
            <input
              className={styles.input}
              value={title}
              onChange={(event) =>
                setTitle(event.target.value.slice(0, MAX_ROOM_TITLE_LENGTH))
              }
              maxLength={MAX_ROOM_TITLE_LENGTH}
              placeholder="작업 효율 200% 높여주는 노래"
              disabled={isSubmitting}
            />
          </label>

          <div className={styles.field}>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={isPasswordEnabled}
                onChange={(event) => {
                  setIsPasswordEnabled(event.target.checked);

                  if (!event.target.checked) {
                    setPassword("");
                  }
                }}
                disabled={isSubmitting}
              />
              <span className={styles.label}>비밀번호 설정</span>
            </label>

            {isPasswordEnabled ? (
              <input
                className={styles.input}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="새 비밀번호 입력 시 변경됩니다"
                disabled={isSubmitting}
              />
            ) : null}
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <span className={styles.label}>큐 장르</span>
              <span className={styles.helperText}>
                {selectedTagSlugs.length}/{MAX_TAGS}
              </span>
            </div>

            {tagsLoading ? (
              <div className={styles.helperText}>장르 불러오는 중...</div>
            ) : null}
            {tagsError ? (
              <div className={styles.errorText}>장르를 불러오지 못했어요.</div>
            ) : null}
            {!tagsLoading && !tagsError ? (
              <div className={styles.tagGrid}>
                {tags.map((tag) => {
                  const selected = selectedTagSlugs.includes(tag.slug);
                  const disabled =
                    !selected && selectedTagSlugs.length >= MAX_TAGS;

                  return (
                    <button
                      key={tag.slug}
                      type="button"
                      className={styles.tagChip}
                      data-selected={selected}
                      disabled={isSubmitting || disabled}
                      onClick={() => toggleTag(tag.slug)}
                    >
                      {tag.name}
                    </button>
                  );
                })}
                {tags.length === 0 ? (
                  <span className={styles.helperText}>장르가 없습니다.</span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className={styles.twoColumn}>
            <label className={styles.field}>
              <span className={styles.label}>최대 인원 수</span>
              <select
                className={styles.select}
                value={maxUsers}
                onChange={(event) => setMaxUsers(event.target.value)}
              >
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>곡 당 제한 시간 (분)</span>
              <select
                className={styles.select}
                value={trackLimitMinutes}
                onChange={(event) => setTrackLimitMinutes(event.target.value)}
              >
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
              </select>
            </label>
          </div>

          {submitError ? (
            <p className={styles.errorText}>
              수정 실패: ({submitError.status}) {submitError.message}
            </p>
          ) : null}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={!canSubmit}
          >
            {isSubmitting ? "큐 수정 중..." : "큐 수정하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
