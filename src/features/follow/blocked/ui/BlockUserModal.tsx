"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DialogPortal from "@/src/shared/ui/dialog/DialogPortal";
import { useDialogA11y } from "@/src/shared/ui/dialog/useDialogA11y";
import { useBlockUser } from "../hooks/useBlockUser";
import styles from "./BlockUserModal.module.css";

export type BlockUserTarget = {
  nickname: string;
  slug: string;
};

type Props = {
  onClose: () => void;
  target: BlockUserTarget | null;
};

export default function BlockUserModal({ onClose, target }: Props) {
  const [isComplete, setIsComplete] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const blockUser = useBlockUser();
  const resetBlockUser = blockUser.reset;
  const open = Boolean(target);
  const handleClose = useCallback(() => {
    if (!blockUser.isPending) {
      setIsComplete(false);
      resetBlockUser();
      onClose();
    }
  }, [blockUser.isPending, onClose, resetBlockUser]);
  const { titleId } = useDialogA11y({ onClose: handleClose, open });

  useEffect(() => {
    if (!open) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    confirmButtonRef.current?.focus();

    return () => {
      previousFocusRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (isComplete) {
      closeButtonRef.current?.focus();
    }
  }, [isComplete]);

  if (!target) {
    return null;
  }

  const handleConfirm = () => {
    if (blockUser.isPending) {
      return;
    }

    blockUser.mutate(target.slug, {
      onSuccess: () => setIsComplete(true),
    });
  };

  return (
    <DialogPortal open={open}>
      <div
        className={styles.overlay}
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            handleClose();
          }
        }}
      >
        <section
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-busy={blockUser.isPending}
        >
          {isComplete ? (
            <>
              <h2 id={titleId} className={styles.title}>
                차단 완료
              </h2>
              <p className={styles.description}>
                {target.nickname}님을 차단했습니다.
              </p>
              <button
                ref={closeButtonRef}
                type="button"
                className={styles.primaryButton}
                onClick={handleClose}
              >
                닫기
              </button>
            </>
          ) : (
            <>
              <h2 id={titleId} className={styles.title}>
                사용자 차단
              </h2>
              <p className={styles.description}>
                {target.nickname}님을 차단하시겠습니까?
              </p>
              <p className={styles.helpText}>
                차단하면 사용자 검색과 팔로우 관계에 반영됩니다.
              </p>
              {blockUser.error ? (
                <p className={styles.error} role="alert">
                  {blockUser.error.message}
                </p>
              ) : null}
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={handleClose}
                  disabled={blockUser.isPending}
                >
                  취소
                </button>
                <button
                  ref={confirmButtonRef}
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleConfirm}
                  disabled={blockUser.isPending}
                >
                  {blockUser.isPending ? "차단 중..." : "차단"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </DialogPortal>
  );
}
