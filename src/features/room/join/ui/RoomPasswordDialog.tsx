"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import DialogPortal from "@/src/shared/ui/dialog/DialogPortal";
import { useDialogA11y } from "@/src/shared/ui/dialog/useDialogA11y";
import styles from "./RoomJoinPasswordModal.module.css";

type Props = {
  errorMessage?: string;
  open: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void | Promise<void>;
};

export default function RoomPasswordDialog({
  errorMessage = "",
  open,
  submitting = false,
  onClose,
  onSubmit,
}: Props) {
  const [password, setPassword] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const descriptionId = useId();
  const errorId = useId();
  const { titleId } = useDialogA11y({
    onClose: submitting ? () => undefined : onClose,
    open,
  });
  const visibleErrorMessage = validationMessage || errorMessage;
  const trimmedPassword = password.trim();

  useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedPassword) {
      setValidationMessage("비밀번호를 입력해주세요.");
      return;
    }

    setValidationMessage("");
    await onSubmit(trimmedPassword);
  }

  return (
    <DialogPortal open={open}>
      <div
        className={styles.overlay}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !submitting) {
            onClose();
          }
        }}
        role="presentation"
      >
        <form
          className={styles.modal}
          onSubmit={handleSubmit}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={
            visibleErrorMessage
              ? `${descriptionId} ${errorId}`
              : descriptionId
          }
        >
          <div className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              방 비밀번호
            </h2>
            <p id={descriptionId} className={styles.description}>
              비밀번호 입력이 필요한 방입니다. 방장이 알려준 비밀번호를
              입력해주세요.
            </p>
          </div>

          <div className={styles.field}>
            <input
              ref={inputRef}
              className={styles.input}
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setValidationMessage("");
              }}
              placeholder="비밀번호 입력"
              disabled={submitting}
              aria-label="방 비밀번호"
              autoComplete="current-password"
            />
            {visibleErrorMessage ? (
              <p id={errorId} className={styles.errorText} role="alert">
                {visibleErrorMessage}
              </p>
            ) : null}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={submitting}
            >
              취소
            </button>
            <button
              type="submit"
              className={styles.confirmButton}
              disabled={!trimmedPassword || submitting}
            >
              {submitting ? (
                <LoadingSpinner ariaLabel="방 비밀번호 확인 중" size={16} />
              ) : (
                "확인"
              )}
            </button>
          </div>
        </form>
      </div>
    </DialogPortal>
  );
}
