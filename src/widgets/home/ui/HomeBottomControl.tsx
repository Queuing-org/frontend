"use client";

import Image from "next/image";
import styles from "./HomeBottomControl.module.css";
import Link from "next/link";

type Props = {
  currentRoomSlug: string;
};

export default function HomeBottomControl({ currentRoomSlug }: Props) {
  return (
    <div className={styles.controlWrap}>
      <button
        type="button"
        className={styles.control}
        aria-label="홈 하단 컨트롤"
      >
        <span className={styles.topLabel}>MENU</span>
        <span className={styles.leftArrow} aria-hidden="true">
          <Image src="/icons/left_arrow.svg" alt="" width={20} height={20} />
        </span>
        <span className={styles.rightArrow} aria-hidden="true">
          <Image src="/icons/right_arrow.svg" alt="" width={20} height={20} />
        </span>
        <Link
          href={`/room/ ${currentRoomSlug} `}
          className={styles.centerCircle}
          aria-label="방입장"
        />
        <span className={styles.bottomLabel}>FILTER</span>
      </button>
    </div>
  );
}
