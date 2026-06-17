"use client";

import { createPortal } from "react-dom";
import styles from "./AddTrackModal.module.css";

type AddTrackModalProps = {
  disabled?: boolean;
  open: boolean;
  reason: string;
  submitting: boolean;
  value: string;
  errorMessage: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
};

export default function AddTrackModal({
  disabled = false,
  open,
  reason,
  submitting,
  value,
  errorMessage,
  onChange,
  onClose,
  onReasonChange,
  onSubmit,
}: AddTrackModalProps) {
  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-track-modal-title"
      >
        <h2 id="add-track-modal-title" className={styles.title}>
          큐잉하기
        </h2>
        <div className={styles.form}>
          <label className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <span className={styles.label}>유튜브 링크 (https://...)</span>
              <a
                href="https://www.youtube.com/"
                target="_blank"
                rel="noreferrer"
                className={styles.youtubeLink}
              >
                찾으러 가기
              </a>
            </div>
            <input
              type="url"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="함께 듣고 싶은 영상의 URL을 붙여넣으세요"
              className={styles.input}
              disabled={submitting}
              autoFocus
            />
          </label>

          {errorMessage ? (
            <div className={styles.error}>{errorMessage}</div>
          ) : null}

          <label className={styles.fieldGroup}>
            <span className={styles.label}>선정한 이유</span>
            <input
              type="text"
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="이 노래를 들으면 힘이 나요"
              className={styles.input}
              disabled={submitting}
            />
          </label>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.actionButton}
            >
              취소
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={disabled || submitting}
              className={`${styles.actionButton} ${styles.submitButton}`}
            >
              {submitting ? "큐잉 중" : "큐잉"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
