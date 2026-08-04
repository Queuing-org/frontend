"use client";

import { useEffect, useId, useRef, type MouseEvent } from "react";
import { Award, Sparkles } from "lucide-react";
import type { BadgeAward } from "../model/badgeAwardEvents";
import { launchBadgeAwardConfetti } from "./badgeAwardConfetti";
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
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.eyebrow}>
          <Sparkles aria-hidden="true" size={14} />
          NEW BADGE
        </div>
        <div className={styles.emblem} aria-hidden="true">
          <span className={styles.emblemRing} />
          <Award size={42} strokeWidth={1.8} />
        </div>
        <h2 id={titleId} className={styles.title}>
          <span className={styles.badgeName}>{badge.name}</span>
          <span className={styles.titleSuffix}>칭호 획득하셨습니다!</span>
        </h2>
        <p className={styles.description}>
          프로필에서 대표 칭호로 설정할 수 있어요.
        </p>
        <button
          ref={confirmButtonRef}
          type="button"
          className={styles.confirmButton}
          onClick={onClose}
        >
          멋진데요!
        </button>
      </section>
    </div>
  );
}
