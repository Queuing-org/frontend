"use client";

import type { ReactNode } from "react";
import RoomThumbnailUploadField, {
  type RoomThumbnailOption,
} from "./RoomThumbnailUploadField";
import styles from "./RoomThumbnailSettingField.module.css";

type RoomThumbnailSettingFieldProps = {
  actionLabel: string;
  currentImageUrl?: string | null;
  disabled?: boolean;
  errorMessage?: string | null;
  fileName?: string | null;
  inputId: string;
  isPreviewUnavailable?: boolean;
  previewUrl?: string | null;
  selectedOption: RoomThumbnailOption;
  statusMessage?: ReactNode;
  statusAriaLabel?: string;
  onFileChange: (files: FileList | null) => void;
  onPreviewError: () => void;
  onSelectDefault: () => void;
};

export default function RoomThumbnailSettingField({
  actionLabel,
  currentImageUrl,
  disabled,
  errorMessage,
  fileName,
  inputId,
  isPreviewUnavailable,
  previewUrl,
  selectedOption,
  statusMessage,
  statusAriaLabel,
  onFileChange,
  onPreviewError,
  onSelectDefault,
}: RoomThumbnailSettingFieldProps) {
  const helpId = `${inputId}-help`;

  return (
    <div className={styles.row}>
      <div className={styles.labelGroup}>
        <span className={styles.label}>썸네일</span>
        <span className={styles.tooltipAnchor}>
          <button
            type="button"
            className={styles.infoButton}
            aria-label="썸네일 기본 동작 안내"
            aria-describedby={helpId}
          >
            !
          </button>
          <span id={helpId} className={styles.tooltip} role="tooltip">
            사진을 업로드하지 않으면 현재 재생중인 노래의 썸네일이
            자동으로 나갑니다
          </span>
        </span>
      </div>
      <RoomThumbnailUploadField
        actionLabel={actionLabel}
        currentImageUrl={currentImageUrl}
        disabled={disabled}
        errorMessage={errorMessage}
        fileName={fileName}
        inputId={inputId}
        isPreviewUnavailable={isPreviewUnavailable}
        previewUrl={previewUrl}
        selectedOption={selectedOption}
        statusMessage={statusMessage}
        statusAriaLabel={statusAriaLabel}
        onFileChange={onFileChange}
        onPreviewError={onPreviewError}
        onSelectDefault={onSelectDefault}
      />
    </div>
  );
}
