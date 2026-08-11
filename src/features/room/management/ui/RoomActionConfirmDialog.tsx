"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import DialogPortal from "@/src/shared/ui/dialog/DialogPortal";
import { useDialogA11y } from "@/src/shared/ui/dialog/useDialogA11y";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import styles from "./RoomActionConfirmDialog.module.css";

type Props = {
  confirmLabel: string;
  description: ReactNode;
  errorMessage?: string | null;
  isPending?: boolean;
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function RoomActionConfirmDialog({
  confirmLabel,
  description,
  errorMessage,
  isPending = false,
  open,
  title,
  onCancel,
  onConfirm,
}: Props) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const descriptionId = useId();
  const errorId = useId();
  const { titleId } = useDialogA11y({
    onClose: isPending ? () => undefined : onCancel,
    open,
  });

  useEffect(() => {
    if (open) {
      cancelButtonRef.current?.focus();
    }
  }, [open]);

  return (
    <DialogPortal open={open}>
      <div
        className={styles.overlay}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isPending) {
            onCancel();
          }
        }}
        role="presentation"
      >
        <section
          className={styles.dialog}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={
            errorMessage ? `${descriptionId} ${errorId}` : descriptionId
          }
        >
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
          {errorMessage ? (
            <p id={errorId} className={styles.error} role="alert">
              {errorMessage}
            </p>
          ) : null}
          <div className={styles.actions}>
            <button
              ref={cancelButtonRef}
              type="button"
              className={styles.cancelButton}
              disabled={isPending}
              onClick={onCancel}
            >
              취소
            </button>
            <button
              type="button"
              className={styles.confirmButton}
              disabled={isPending}
              onClick={onConfirm}
            >
              {isPending ? (
                <LoadingSpinner
                  ariaLabel={`${confirmLabel} 처리 중`}
                  color="#ff0000"
                  size={18}
                />
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </section>
      </div>
    </DialogPortal>
  );
}
