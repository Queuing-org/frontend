"use client";

/* eslint-disable @next/next/no-img-element -- Local blob previews cannot use next/image optimization. */

import { useRef, type ChangeEvent, type ReactNode } from "react";
import { Camera } from "lucide-react";
import { ROOM_THUMBNAIL_ACCEPT } from "@/src/features/room/hooks/useRoomThumbnailSelection";
import { getDefaultRoomImage } from "@/src/features/room/lib/getDefaultRoomImage";
import styles from "./RoomThumbnailUploadField.module.css";

export type RoomThumbnailOption = "upload" | "default";

type RoomThumbnailUploadFieldProps = {
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

export default function RoomThumbnailUploadField({
  actionLabel,
  currentImageUrl,
  disabled = false,
  errorMessage,
  fileName,
  inputId,
  isPreviewUnavailable = false,
  previewUrl,
  selectedOption,
  statusMessage,
  statusAriaLabel,
  onFileChange,
  onPreviewError,
  onSelectDefault,
}: RoomThumbnailUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const displayImageUrl = previewUrl ?? currentImageUrl ?? null;
  const hasSelectedFile = Boolean(fileName);
  const canShowPreview = Boolean(displayImageUrl) && !isPreviewUnavailable;

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFileChange(event.target.files);
    event.target.value = "";
  };

  return (
    <div className={styles.root}>
      <input
        ref={inputRef}
        id={inputId}
        className={styles.fileInput}
        type="file"
        accept={ROOM_THUMBNAIL_ACCEPT}
        disabled={disabled}
        aria-invalid={Boolean(errorMessage)}
        aria-describedby={errorMessage ? `${inputId}-error` : undefined}
        onChange={handleInputChange}
      />
      <div className={styles.controlRow}>
        <button
          type="button"
          className={styles.uploadButton}
          aria-label={actionLabel}
          data-invalid={Boolean(errorMessage)}
          data-selected={selectedOption === "upload" || undefined}
          aria-pressed={selectedOption === "upload"}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {canShowPreview ? (
            <img
              src={displayImageUrl ?? undefined}
              alt=""
              className={styles.previewImage}
              onError={previewUrl ? onPreviewError : undefined}
            />
          ) : (
            <span className={styles.placeholder} data-has-file={hasSelectedFile}>
              <Camera className={styles.cameraIcon} aria-hidden="true" />
              <span className={styles.thumbnailText}>
                {fileName ?? actionLabel}
              </span>
            </span>
          )}
        </button>
        <button
          type="button"
          className={styles.defaultButton}
          aria-label="큐잉 기본 이미지 사용"
          aria-pressed={selectedOption === "default"}
          data-selected={selectedOption === "default" || undefined}
          disabled={disabled}
          onClick={onSelectDefault}
        >
          <img
            src={getDefaultRoomImage()}
            alt=""
            className={styles.previewImage}
          />
        </button>
      </div>
      {errorMessage ? (
        <p id={`${inputId}-error`} className={styles.visuallyHidden}>
          {errorMessage}
        </p>
      ) : statusMessage ? (
        <p
          className={styles.feedback}
          data-tone="status"
          role="status"
          aria-label={statusAriaLabel}
        >
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
