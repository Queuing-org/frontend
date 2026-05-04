"use client";

import Image from "next/image";
import styles from "./RoomStageCard.module.css";

type Props = {
  slug: string;
  title: string;
  imageSrc: string;
  isSelected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

export default function RoomStageCard({
  slug,
  title,
  imageSrc,
  isSelected = false,
  disabled = false,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-room-slug={slug}
      aria-label={`${title} 방 선택`}
      className={`${styles.card} ${isSelected ? styles.selected : ""}`}
    >
      <Image
        src={imageSrc}
        alt=""
        fill
        sizes="(max-width: 900px) 68vw, 38vw"
        className={styles.image}
        priority={isSelected}
      />
      <div className={styles.scrim} />
    </button>
  );
}
