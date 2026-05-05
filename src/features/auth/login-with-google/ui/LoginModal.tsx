"use client";

import Image from "next/image";
import { useEffect, useId, useRef } from "react";
import type { MouseEvent } from "react";
import { createPortal } from "react-dom";
import GoogleLoginButton from "./GoogleLoginButton";
import styles from "./LoginModal.module.css";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onGoogleLogin: () => void;
};

export default function LoginModal({
  open,
  onClose,
  onGoogleLogin,
}: LoginModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const googleButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    googleButtonRef.current?.focus();

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
      className={styles.modalOverlay}
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
        <div className={styles.modalLogo} aria-hidden="true">
          <Image
            src="/Basic_Profile.png"
            alt=""
            width={80}
            height={80}
            draggable={false}
            unoptimized
            priority
            className={styles.modalLogoImage}
          />
        </div>
        <h2 id={titleId} className={styles.modalTitle}>
          좋아하는 노래를 함께 듣고
          <br />그 순간을 공유해요
        </h2>
        <p id={descriptionId} className={styles.modalDescription}>
          혼자 듣기 아까운 노래를 같이 들으며 감동을 나눠보세요.
        </p>
        <GoogleLoginButton ref={googleButtonRef} onClick={onGoogleLogin} />
        <div className={styles.separator} aria-hidden="true" />
        <p className={styles.policyText}>
          가입하면 <span className={styles.policyHighlight}>개인정보 보호정책</span>에
          동의하는 것으로 간주됩니다.
        </p>
      </section>
    </div>,
    document.body,
  );
}
