"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import styles from "./ManagementMenuShell.module.css";

type Props = {
  children: ReactNode;
  label: string;
  menuId: string;
  onClose: () => void;
  placement?: "down" | "up";
  triggerRef: RefObject<HTMLButtonElement | null>;
};

export default function ManagementMenuShell({
  children,
  label,
  menuId,
  onClose,
  placement = "down",
  triggerRef,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    menuRef.current
      ?.querySelector<HTMLButtonElement>("[role='menuitem']:not(:disabled)")
      ?.focus();

    const handlePointerDown = (event: PointerEvent) => {
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
      event.preventDefault();
      onClose();
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, triggerRef]);

  return (
    <div
      ref={menuRef}
      id={menuId}
      className={styles.menu}
      role="menu"
      aria-label={label}
      data-placement={placement}
    >
      {children}
    </div>
  );
}
