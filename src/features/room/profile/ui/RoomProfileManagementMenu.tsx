"use client";

import { useEffect, useRef, type RefObject } from "react";
import styles from "./RoomProfileManagementMenu.module.css";

type Props = {
  canKick: boolean;
  isKickPending: boolean;
  onBlock: () => void;
  onClose: () => void;
  onKick: () => void;
  onReport: () => void;
  open: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

export default function RoomProfileManagementMenu({
  canKick,
  isKickPending,
  onBlock,
  onClose,
  onKick,
  onReport,
  open,
  triggerRef,
}: Props) {
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    firstActionRef.current?.focus();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      onClose();
      queueMicrotask(() => triggerRef.current?.focus());
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open, triggerRef]);

  if (!open) {
    return null;
  }

  const runAndClose = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className={styles.menu}
      role="menu"
      aria-label="프로필 관리"
    >
      <button
        ref={firstActionRef}
        type="button"
        className={`${styles.menuItem} ${styles.reportItem}`}
        role="menuitem"
        onClick={() => runAndClose(onReport)}
      >
        신고
      </button>
      <button
        type="button"
        className={styles.menuItem}
        role="menuitem"
        onClick={() => runAndClose(onBlock)}
      >
        차단
      </button>
      {canKick ? (
        <button
          type="button"
          className={styles.menuItem}
          role="menuitem"
          disabled={isKickPending}
          onClick={() => runAndClose(onKick)}
        >
          {isKickPending ? "내보내는 중..." : "내보내기"}
        </button>
      ) : null}
    </div>
  );
}
