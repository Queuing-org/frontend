"use client";

import Image from "next/image";
import { useRoomMeta } from "../hooks/useRoomMeta";
import styles from "./RoomStageCard.module.css";

type Props = {
  slug: string;
  title: string;
  imageSrc: string;
  isSelected?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  onClick?: () => void;
};

export default function RoomStageCard({
  slug,
  title,
  imageSrc,
  isSelected = false,
  disabled = false,
  ariaLabel,
  onClick,
}: Props) {
  const { data } = useRoomMeta(slug);
  const owner = data?.owner ?? null;
  const ownerName = owner?.nickname?.trim() ?? "";
  const ownerImageSrc = owner?.profileImageUrl || "/Basic_Profile.png";
  const showOwnerBar = isSelected && ownerName;

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
      {showOwnerBar ? (
        <div className={styles.ownerBar}>
          <span className={styles.ownerAvatarWrap}>
            <Image
              src={ownerImageSrc}
              alt=""
              fill
              sizes="52px"
              unoptimized={Boolean(owner?.profileImageUrl)}
              className={styles.ownerAvatar}
            />
          </span>
          <span className={styles.ownerName}>{ownerName}</span>
        </div>
      ) : null}
    </button>
  );
}
