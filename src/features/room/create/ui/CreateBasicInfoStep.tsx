"use client";

import type { ReactNode } from "react";
import styles from "./CreateBasicInfoStep.module.css";
import RoomThumbnailUploadField from "./RoomThumbnailUploadField";

type CreateBasicInfoStepProps = {
  title: string;
  maxTitleLength: number;
  disabled: boolean;
  thumbnailDisabled?: boolean;
  thumbnailErrorMessage?: string | null;
  thumbnailFileName?: string | null;
  thumbnailPreviewUrl?: string | null;
  thumbnailStatusMessage?: ReactNode;
  thumbnailStatusAriaLabel?: string;
  isThumbnailPreviewUnavailable?: boolean;
  onTitleChange: (title: string) => void;
  onThumbnailChange: (files: FileList | null) => void;
  onThumbnailClear: () => void;
  onThumbnailPreviewError: () => void;
};

export default function CreateBasicInfoStep({
  title,
  maxTitleLength,
  disabled,
  thumbnailDisabled = disabled,
  thumbnailErrorMessage,
  thumbnailFileName,
  thumbnailPreviewUrl,
  thumbnailStatusMessage,
  thumbnailStatusAriaLabel,
  isThumbnailPreviewUnavailable,
  onTitleChange,
  onThumbnailChange,
  onThumbnailClear,
  onThumbnailPreviewError,
}: CreateBasicInfoStepProps) {
  return (
    <div className={styles.stack}>
      <div className={styles.row}>
        <div className={styles.labelGroup}>
          <span className={styles.label}>썸네일</span>
          <span className={styles.tooltipAnchor}>
            <button
              type="button"
              className={styles.infoButton}
              aria-label="썸네일 기본 동작 안내"
              aria-describedby="create-room-thumbnail-help"
            >
              !
            </button>
            <span
              id="create-room-thumbnail-help"
              className={styles.tooltip}
              role="tooltip"
            >
              사진을 업로드하지 않으면 현재 재생중인 노래의 썸네일이
              자동으로 나갑니다
            </span>
          </span>
        </div>
        <RoomThumbnailUploadField
          actionLabel="UPLOAD"
          disabled={thumbnailDisabled}
          errorMessage={thumbnailErrorMessage}
          fileName={thumbnailFileName}
          inputId="create-room-thumbnail"
          isPreviewUnavailable={isThumbnailPreviewUnavailable}
          previewUrl={thumbnailPreviewUrl}
          statusMessage={thumbnailStatusMessage}
          statusAriaLabel={thumbnailStatusAriaLabel}
          variant="create"
          onClearSelection={onThumbnailClear}
          onFileChange={onThumbnailChange}
          onPreviewError={onThumbnailPreviewError}
        />
      </div>

      <label className={styles.row} htmlFor="create-room-title">
        <span className={styles.label}>방 제목</span>
        <input
          id="create-room-title"
          className={styles.input}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          maxLength={maxTitleLength}
          placeholder="방의 주제나 성격을 잘 나타내는 제목을 입력해주세요"
          disabled={disabled}
        />
      </label>
    </div>
  );
}
