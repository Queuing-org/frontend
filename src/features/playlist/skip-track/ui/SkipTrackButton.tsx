"use client";

import { useSkipTrackAction } from "../hooks/useSkipTrackAction";
import styles from "./SkipTrackButton.module.css";

type SkipTrackButtonProps = {
  className?: string;
  isVisible: boolean;
  slug: string | null;
};

export default function SkipTrackButton({
  className,
  isVisible,
  slug,
}: SkipTrackButtonProps) {
  const { errorMessage, skipTrack } = useSkipTrackAction(slug);

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      className={[styles.button, className].filter(Boolean).join(" ")}
      onClick={skipTrack}
      aria-label="다음 곡으로 넘기기"
      title={errorMessage || "다음 곡으로 넘기기"}
    >
      SKIP
    </button>
  );
}
