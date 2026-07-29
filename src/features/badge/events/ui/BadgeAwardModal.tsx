"use client";

import { useEffect, useId, useRef, type MouseEvent } from "react";
import type { BadgeAward } from "../model/badgeAwardEvents";
import styles from "./BadgeAwardModal.module.css";

type Props = {
  badge: BadgeAward | null;
  onClose: () => void;
};

export default function BadgeAwardModal({ badge, onClose }: Props) {
  const titleId = useId();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!badge) {
      return;
    }

    confirmButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [badge, onClose]);

  if (!badge) {
    return null;
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={handleBackdropClick}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className={styles.title}>
          {badge.name} 칭호 획득하셨습니다!
        </h2>
        <button
          ref={confirmButtonRef}
          type="button"
          className={styles.confirmButton}
          onClick={onClose}
        >
          확인
        </button>
      </section>
    </div>
  );
}
