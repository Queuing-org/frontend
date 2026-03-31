"use client";

import type { ReactNode } from "react";
import styles from "./FloatingRoomPanelShell.module.css";

type Props = {
  children: ReactNode;
  height: number;
  width: number;
};

export default function FloatingRoomPanelShell({
  children,
  height,
  width,
}: Props) {
  return (
    <div className={styles.panel} style={{ width, height }}>
      <div
        className={styles.header}
        aria-hidden="true"
        data-drag-handle="true"
      >
        <span className={styles.handle} />
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
