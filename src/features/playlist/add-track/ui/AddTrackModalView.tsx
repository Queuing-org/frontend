"use client";

import DialogPortal from "@/src/shared/ui/dialog/DialogPortal";
import { useDialogA11y } from "@/src/shared/ui/dialog/useDialogA11y";
import AddTrackFormFields from "./AddTrackFormFields";
import styles from "./AddTrackModal.module.css";

type AddTrackModalProps = {
  disabled?: boolean;
  open: boolean;
  submitting: boolean;
  value: string;
  errorMessage: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function AddTrackModal({
  disabled = false,
  open,
  submitting,
  value,
  errorMessage,
  onChange,
  onClose,
  onSubmit,
}: AddTrackModalProps) {
  const { titleId } = useDialogA11y({ onClose, open });

  return (
    <DialogPortal open={open}>
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
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className={styles.title}>
          큐잉하기
        </h2>
        <div className={styles.form}>
          <AddTrackFormFields
            errorMessage={errorMessage}
            submitting={submitting}
            value={value}
            onChange={onChange}
          />

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
    </div>
    </DialogPortal>
  );
}
