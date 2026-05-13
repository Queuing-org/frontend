"use client";

import { useEffect, useId, useRef } from "react";
import type { MouseEvent } from "react";
import { createPortal } from "react-dom";
import styles from "./AuthRequiredModal.module.css";

type AuthRequiredModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  loginLabel?: string;
  onClose: () => void;
  onLogin: () => void;
};

export default function AuthRequiredModal({
  open,
  title = "로그인 후 이용해주세요",
  description = "계정으로 로그인하면 이 기능을 사용할 수 있어요.",
  loginLabel = "로그인",
  onClose,
  onLogin,
}: AuthRequiredModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const loginButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    loginButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  function handleOverlayMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={handleOverlayMouseDown}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onClose}
          >
            닫기
          </button>
          <button
            ref={loginButtonRef}
            type="button"
            className={styles.primaryButton}
            onClick={onLogin}
          >
            {loginLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
