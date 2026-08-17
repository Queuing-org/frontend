"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import {
  getBadgeAchievementCopy,
  type BadgeAward,
} from "../model/badgeAwardEvents";
import DialogPortal from "@/src/shared/ui/dialog/DialogPortal";
import { useDialogA11y } from "@/src/shared/ui/dialog/useDialogA11y";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import { launchBadgeAwardConfetti } from "./badgeAwardConfetti";
import styles from "./BadgeAwardModal.module.css";

type Props = {
  applyErrorMessage?: string | null;
  badge: BadgeAward | null;
  isApplying?: boolean;
  onApply: () => void;
  onClose: () => void;
};

export default function BadgeAwardModal({
  applyErrorMessage = null,
  badge,
  isApplying = false,
  onApply,
  onClose,
}: Props) {
  const modalRef = useRef<HTMLElement>(null);
  const applyButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const open = Boolean(badge);
  const handleClose = useCallback(() => {
    if (!isApplying) {
      onClose();
    }
  }, [isApplying, onClose]);
  const { titleId } = useDialogA11y({
    onClose: handleClose,
    open,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    return () => {
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!badge) {
      return;
    }

    if (isApplying) {
      modalRef.current?.focus();
      return;
    }

    applyButtonRef.current?.focus();
  }, [badge, isApplying]);

  useEffect(() => {
    if (!badge) {
      return;
    }

    const controller = new AbortController();
    // 장식 효과 실패가 칭호 안내 자체를 막아서는 안 된다.
    void launchBadgeAwardConfetti(controller.signal).catch(() => undefined);

    return () => {
      controller.abort();
    };
  }, [badge]);

  if (!badge) {
    return null;
  }

  const copy = getBadgeAchievementCopy(badge);
  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };
  const handleDialogKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab") {
      return;
    }

    if (isApplying) {
      event.preventDefault();
      modalRef.current?.focus();
      return;
    }

    const firstFocusable = applyButtonRef.current;
    const lastFocusable = confirmButtonRef.current;
    if (!firstFocusable || !lastFocusable) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
  };

  return (
    <DialogPortal open>
      <div
        className={styles.backdrop}
        role="presentation"
        onMouseDown={handleBackdropClick}
      >
        <section
          ref={modalRef}
          className={styles.modal}
          role="dialog"
          tabIndex={-1}
          aria-modal="true"
          aria-labelledby={titleId}
          aria-busy={isApplying}
          onKeyDown={handleDialogKeyDown}
        >
          <div className={styles.badgeName} title={badge.name}>
            {badge.name}
          </div>
          <h2 id={titleId} className={styles.title}>
            새로운 칭호 획득
          </h2>
          <p className={styles.description}>
            <span>{copy.achievement}</span>
            <span>{copy.award}</span>
            <span>{copy.encouragement}</span>
          </p>
          {applyErrorMessage ? (
            <p className={styles.error} role="alert">
              {applyErrorMessage}
            </p>
          ) : null}
          <div className={styles.actions}>
            <button
              ref={applyButtonRef}
              type="button"
              className={styles.applyButton}
              disabled={isApplying}
              onClick={onApply}
            >
              {isApplying ? (
                <LoadingSpinner
                  ariaLabel="대표 칭호 적용 중"
                  color="#ffffff"
                  size={16}
                />
              ) : (
                "적용하기"
              )}
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              className={styles.confirmButton}
              disabled={isApplying}
              onClick={handleClose}
            >
              확인
            </button>
          </div>
        </section>
      </div>
    </DialogPortal>
  );
}
