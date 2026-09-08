"use client";

import type { ReactNode } from "react";
import styles from "./FloatingPanelShell.module.css";

type Props = {
  children: ReactNode;
  compactHeader?: boolean;
  contentClassName?: string;
  contentPadding?: "default" | "none";
  density?: "auto" | "compact" | "normal";
  height: number;
  width: number;
};

export default function FloatingPanelShell({
  children,
  compactHeader = false,
  contentClassName,
  contentPadding = "default",
  density = "auto",
  height,
  width,
}: Props) {
  return (
    <div
      className={styles.panel}
      data-density={density}
      style={{ width, height }}
    >
      <span
        className={`${styles.edgeDragHandle} ${styles.edgeDragHandleNorth}`}
        aria-hidden="true"
        data-drag-handle="true"
      />
      <span
        className={`${styles.edgeDragHandle} ${styles.edgeDragHandleEast}`}
        aria-hidden="true"
        data-drag-handle="true"
      />
      <span
        className={`${styles.edgeDragHandle} ${styles.edgeDragHandleSouth}`}
        aria-hidden="true"
        data-drag-handle="true"
      />
      <span
        className={`${styles.edgeDragHandle} ${styles.edgeDragHandleWest}`}
        aria-hidden="true"
        data-drag-handle="true"
      />
      <div
        className={[styles.header, compactHeader ? styles.headerCompact : null]
          .filter(Boolean)
          .join(" ")}
        aria-hidden="true"
        data-drag-handle="true"
      >
        <span className={styles.handle} />
      </div>
      <div
        data-content-padding={contentPadding}
        className={[styles.content, contentClassName].filter(Boolean).join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
