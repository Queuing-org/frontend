"use client";

import Image from "next/image";
import styles from "./RoomControlBar.module.css";

export default function RoomButtonControlBar() {
  return (
    <div className={styles.outerBar}>
      <button type="button" className={styles.iconButton} aria-label="프로필">
        <Image src="/icons/profile.svg" alt="" width={20} height={20} />
      </button>
      <button type="button" className={styles.iconButton} aria-label="큐">
        <Image src="/icons/queue.svg" alt="" width={20} height={20} />
      </button>
      <button type="button" className={styles.iconButton} aria-label="나가기">
        <Image src="/icons/exit.svg" alt="" width={20} height={20} />
      </button>
      <button type="button" className={styles.iconButton} aria-label="좋아요">
        <Image src="/icons/heart.svg" alt="" width={20} height={20} />
      </button>
      <button type="button" className={styles.iconButton} aria-label="채팅">
        <Image src="/icons/chat.svg" alt="" width={20} height={20} />
      </button>
    </div>
  );
}
