"use client";

import type { ReactNode } from "react";
import styles from "./RadialControl.module.css";

type RadialControlProps = {
  ariaLabel?: string;
  top?: ReactNode;
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  bottom?: ReactNode;
};

export default function RadialControl({
  ariaLabel,
  top,
  left,
  center,
  right,
  bottom,
}: RadialControlProps) {
  return (
    <div
      className={styles.control}
      role={ariaLabel ? "group" : undefined}
      aria-label={ariaLabel}
    >
      <div className={`${styles.slot} ${styles.topSlot}`}>{top}</div>
      <div className={`${styles.slot} ${styles.leftSlot}`}>{left}</div>
      <div className={`${styles.slot} ${styles.centerSlot}`}>{center}</div>
      <div className={`${styles.slot} ${styles.rightSlot}`}>{right}</div>
      <div className={`${styles.slot} ${styles.bottomSlot}`}>{bottom}</div>
    </div>
  );
}
