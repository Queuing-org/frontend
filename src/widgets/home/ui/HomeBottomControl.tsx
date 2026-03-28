"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./HomeBottomControl.module.css";

type Props = {
  currentRoomSlug: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onGoPrevious: () => void;
  onGoNext: () => void;
};

export default function HomeBottomControl({
  currentRoomSlug,
  canGoPrevious,
  canGoNext,
  onGoPrevious,
  onGoNext,
}: Props) {
  return (
    <div className={styles.controlWrap}>
      <div className={styles.control} aria-label="홈 하단 컨트롤">
        <span className={styles.topLabel}>MENU</span>
        <button
          type="button"
          className={styles.leftArrow}
          onClick={onGoPrevious}
          disabled={!canGoPrevious}
          aria-label="이전 방 보기"
        >
          <Image src="/icons/left_arrow.svg" alt="" width={20} height={20} />
        </button>
        <button
          type="button"
          className={styles.rightArrow}
          onClick={onGoNext}
          disabled={!canGoNext}
          aria-label="다음 방 보기"
        >
          <Image src="/icons/right_arrow.svg" alt="" width={20} height={20} />
        </button>
        <Link
          href={`/room/${encodeURIComponent(currentRoomSlug)}`}
          className={styles.centerCircle}
          aria-label="방입장"
        />
        <span className={styles.bottomLabel}>FILTER</span>
      </div>
    </div>
  );
}
