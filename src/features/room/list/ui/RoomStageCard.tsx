"use client";

import Image from "next/image";
import type { RoomOwner } from "@/src/features/room/model/types";
import SelectedRoomOwnerBar from "./SelectedRoomOwnerBar";
import styles from "./RoomStageCard.module.css";

type Props = {
  slug: string;
  title: string;
  imageSrc: string;
  owner?: RoomOwner | null;
  isSelected?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  onClick?: () => void;
};

export default function RoomStageCard({
  slug,
  title,
  imageSrc,
  owner = null,
  isSelected = false,
  disabled = false,
  ariaLabel,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-room-slug={slug}
      aria-label={ariaLabel ?? `${title} 방 선택`}
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
      {isSelected && owner ? <SelectedRoomOwnerBar owner={owner} /> : null}
    </button>
  );
}
