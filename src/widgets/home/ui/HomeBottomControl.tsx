"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./HomeBottomControl.module.css";

type Props = {
  currentRoomSlug: string;
};

export default function HomeBottomControl({ currentRoomSlug }: Props) {
  const router = useRouter();

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
        <span
          className={styles.centerCircle}
          onClick={() => router.push(`/room/${currentRoomSlug}`)}
          aria-hidden="true"
        />
        <span className={styles.bottomLabel}>FILTER</span>
      </button>
    </div>
  );
}
