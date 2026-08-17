"use client";

import type { ReactNode } from "react";
import styles from "./CreateBasicInfoStep.module.css";
import RoomThumbnailSettingField from "./RoomThumbnailSettingField";

type CreateBasicInfoStepProps = {
  title: string;
  titleInvalid?: boolean;
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
  titleInvalid = false,
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
      <RoomThumbnailSettingField
        actionLabel="UPLOAD"
        disabled={thumbnailDisabled}
        errorMessage={thumbnailErrorMessage}
        fileName={thumbnailFileName}
        inputId="create-room-thumbnail"
        isPreviewUnavailable={isThumbnailPreviewUnavailable}
        previewUrl={thumbnailPreviewUrl}
        selectedOption={thumbnailFileName ? "upload" : "default"}
        statusMessage={thumbnailStatusMessage}
        statusAriaLabel={thumbnailStatusAriaLabel}
        onFileChange={onThumbnailChange}
        onPreviewError={onThumbnailPreviewError}
        onSelectDefault={onThumbnailClear}
      />

      <label className={styles.row} htmlFor="create-room-title">
        <span className={styles.label}>방 제목</span>
        <input
          id="create-room-title"
          aria-label="방 제목"
          className={styles.input}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          maxLength={maxTitleLength}
          placeholder="방의 주제나 성격을 잘 나타내는 제목을 입력해주세요"
          disabled={disabled}
          aria-invalid={titleInvalid}
          aria-describedby={titleInvalid ? "create-room-title-error" : undefined}
        />
        <span id="create-room-title-error" className={styles.visuallyHidden}>
          방 제목을 입력해 주세요.
        </span>
      </label>
    </div>
  );
}
