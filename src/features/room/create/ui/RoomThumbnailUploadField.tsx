"use client";

/* eslint-disable @next/next/no-img-element -- Local blob previews cannot use next/image optimization. */

import { useRef, type ChangeEvent } from "react";
import { Camera, X } from "lucide-react";
import { ROOM_THUMBNAIL_ACCEPT } from "@/src/features/room/hooks/useRoomThumbnailSelection";
import styles from "./RoomThumbnailUploadField.module.css";

type RoomThumbnailUploadFieldProps = {
  actionLabel: string;
  currentImageUrl?: string | null;
  disabled?: boolean;
  errorMessage?: string | null;
  fileName?: string | null;
  inputId: string;
  isPreviewUnavailable?: boolean;
  previewUrl?: string | null;
  variant: "create" | "edit";
  onClearSelection: () => void;
  onFileChange: (files: FileList | null) => void;
  onPreviewError: () => void;
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
  variant,
  onClearSelection,
  onFileChange,
  onPreviewError,
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
    <div className={styles.root} data-variant={variant}>
      <input
        ref={inputRef}
        id={inputId}
        className={styles.fileInput}
        type="file"
        accept={ROOM_THUMBNAIL_ACCEPT}
        disabled={disabled}
        onChange={handleInputChange}
      />
      <div className={styles.controlRow}>
        <button
          type="button"
          className={styles.uploadButton}
          data-has-image={Boolean(displayImageUrl)}
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
        {hasSelectedFile ? (
          <button
            type="button"
            className={styles.clearButton}
            aria-label="선택한 썸네일 제거"
            disabled={disabled}
            onClick={onClearSelection}
          >
            <X className={styles.clearIcon} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {errorMessage ? (
        <p className={styles.feedback} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
