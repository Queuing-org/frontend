"use client";

import styles from "./RoomStageCard.module.css";

type Props = {
  slug: string;
  title: string;
  isSelected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

export default function RoomStageCard({
  slug,
  title,
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
      className={`${styles.card} ${isSelected ? styles.selected : ""}`}
    >
      <div className={styles.title}>{title}</div>
    </button>
  );
}
