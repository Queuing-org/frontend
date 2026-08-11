"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import styles from "./ManagementMenuShell.module.css";

type Props = {
  children: ReactNode;
  label: string;
  menuId: string;
  onClose: () => void;
  placement?: "down" | "up";
  positioning?: "inline" | "viewport";
  anchorBoundaryRef?: RefObject<HTMLElement | null>;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

const VIEWPORT_MARGIN = 8;
const MENU_GAP = 2;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export default function ManagementMenuShell({
  children,
  label,
  menuId,
  onClose,
  placement = "down",
  positioning = "inline",
  anchorBoundaryRef,
  triggerRef,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const [viewportStyle, setViewportStyle] = useState<CSSProperties>({
    visibility: "hidden",
  });

  useLayoutEffect(() => {
    if (positioning !== "viewport") {
      return;
    }

    const updatePosition = () => {
      const menu = menuRef.current;
      const trigger = triggerRef.current;
      if (!menu || !trigger) {
        return;
      }

      const triggerRect = trigger.getBoundingClientRect();
      const boundaryRect = anchorBoundaryRef?.current?.getBoundingClientRect();
      if (
        boundaryRect &&
        (boundaryRect.width > 0 || boundaryRect.height > 0) &&
        (triggerRect.bottom <= boundaryRect.top ||
          triggerRect.top >= boundaryRect.bottom ||
          triggerRect.right <= boundaryRect.left ||
          triggerRect.left >= boundaryRect.right)
      ) {
        onClose();
        return;
      }

      const menuRect = menu.getBoundingClientRect();
      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;
      const topBelow = triggerRect.bottom + MENU_GAP;
      const topAbove = triggerRect.top - menuRect.height - MENU_GAP;
      const fitsBelow =
        topBelow + menuRect.height <= viewportHeight - VIEWPORT_MARGIN;
      const fitsAbove = topAbove >= VIEWPORT_MARGIN;
      const top = fitsBelow
        ? topBelow
        : fitsAbove
          ? topAbove
          : clamp(
              topBelow,
              VIEWPORT_MARGIN,
              viewportHeight - menuRect.height - VIEWPORT_MARGIN,
            );
      const left = clamp(
        triggerRect.right - menuRect.width,
        VIEWPORT_MARGIN,
        viewportWidth - menuRect.width - VIEWPORT_MARGIN,
      );

      setViewportStyle({ left, top, visibility: "visible" });
    };
    const requestPositionUpdate = () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        updatePosition();
      });
    };

    updatePosition();
    document.addEventListener("scroll", requestPositionUpdate, true);
    window.addEventListener("resize", requestPositionUpdate);
    window.visualViewport?.addEventListener("resize", requestPositionUpdate);
    window.visualViewport?.addEventListener("scroll", requestPositionUpdate);
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(requestPositionUpdate);
    if (menuRef.current) {
      resizeObserver?.observe(menuRef.current);
    }

    return () => {
      document.removeEventListener("scroll", requestPositionUpdate, true);
      window.removeEventListener("resize", requestPositionUpdate);
      window.visualViewport?.removeEventListener(
        "resize",
        requestPositionUpdate,
      );
      window.visualViewport?.removeEventListener(
        "scroll",
        requestPositionUpdate,
      );
      resizeObserver?.disconnect();
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [anchorBoundaryRef, onClose, positioning, triggerRef]);

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

  const menu = (
    <div
      ref={menuRef}
      id={menuId}
      className={styles.menu}
      role="menu"
      aria-label={label}
      data-placement={placement}
      data-positioning={positioning}
      style={positioning === "viewport" ? viewportStyle : undefined}
    >
      {children}
    </div>
  );

  return positioning === "viewport" && typeof document !== "undefined"
    ? createPortal(menu, document.body)
    : menu;
}
