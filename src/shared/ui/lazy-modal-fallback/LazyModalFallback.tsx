"use client";

import { useEffect, useRef } from "react";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import styles from "./LazyModalFallback.module.css";

type Props = {
  label: string;
};

export default function LazyModalFallback({ label }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <div className={styles.overlay} role="presentation">
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        <LoadingSpinner ariaLabel={label} size={28} />
      </div>
    </div>
  );
}
