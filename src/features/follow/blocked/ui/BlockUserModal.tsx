"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DialogPortal from "@/src/shared/ui/dialog/DialogPortal";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import { useDialogA11y } from "@/src/shared/ui/dialog/useDialogA11y";
import { useBlockUser } from "../hooks/useBlockUser";
import styles from "./BlockUserModal.module.css";

const REASON_MAX_LENGTH = 500;

export type BlockUserTarget = {
  nickname: string;
  slug: string;
};

type Props = {
  onBlocked?: (target: BlockUserTarget) => void;
  onClose: () => void;
  target: BlockUserTarget | null;
};

export default function BlockUserModal({ onBlocked, onClose, target }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [reasonState, setReasonState] = useState({
    targetSlug: null as string | null,
    value: "",
  });
  const blockUser = useBlockUser();
  const resetBlockUser = blockUser.reset;
  const open = Boolean(target);
  const targetSlug = target?.slug ?? null;

  if (reasonState.targetSlug !== targetSlug) {
    setReasonState({ targetSlug, value: "" });
  }

  const handleClose = useCallback(() => {
    if (!blockUser.isPending) {
      setReasonState({ targetSlug: null, value: "" });
      resetBlockUser();
      onClose();
    }
  }, [blockUser.isPending, onClose, resetBlockUser]);
  const { titleId } = useDialogA11y({ onClose: handleClose, open });

  useEffect(() => {
    resetBlockUser();
  }, [resetBlockUser, target?.slug]);

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
    if (blockUser.isSuccess) {
      closeButtonRef.current?.focus();
    }
  }, [blockUser.isSuccess]);

  useEffect(() => {
    if (blockUser.error) {
      confirmButtonRef.current?.focus();
    }
  }, [blockUser.error]);

  if (!target) {
    return null;
  }

  const reason = reasonState.value;

  const handleConfirm = () => {
    if (blockUser.isPending || reason.length > REASON_MAX_LENGTH) {
      return;
    }

    blockUser.mutate(
      { targetSlug: target.slug, reason },
      {
        onSuccess: () => {
          setReasonState({ targetSlug: null, value: "" });
          onBlocked?.(target);
        },
      },
    );
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
          {blockUser.isSuccess ? (
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
              <label className={styles.reasonLabel} htmlFor="block-user-reason">
                차단 사유 <span>(선택)</span>
              </label>
              <textarea
                id="block-user-reason"
                className={styles.reasonInput}
                maxLength={REASON_MAX_LENGTH}
                value={reason}
                onChange={(event) =>
                  setReasonState({
                    targetSlug: target.slug,
                    value: event.target.value,
                  })
                }
                placeholder="차단하는 이유를 입력해 주세요."
                disabled={blockUser.isPending}
              />
              <div className={styles.reasonCount} aria-live="polite">
                {reason.length}/{REASON_MAX_LENGTH}
              </div>
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
                  {blockUser.isPending ? (
                    <LoadingSpinner
                      ariaLabel="차단 중"
                      color="#ffffff"
                      size={16}
                    />
                  ) : (
                    "차단"
                  )}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </DialogPortal>
  );
}
