"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, type ReactNode } from "react";
import styles from "./FollowUserCard.module.css";

type Props = {
  nickname: string;
  onSelect?: (trigger: HTMLButtonElement) => void;
  presence?: {
    online: boolean;
  };
  profileImageUrl: string | null;
  roomLink?: {
    href: string;
    label: string;
  };
  trailingAction?: ReactNode;
};

export default function FollowUserCard({
  nickname,
  onSelect,
  presence,
  profileImageUrl,
  roomLink,
  trailingAction,
}: Props) {
  const roomTooltipId = useId();
  const profileImageSrc = profileImageUrl || "/Basic_Profile.png";
  const profile = (
    <>
      <span className={styles.avatarWrap}>
        <Image
          src={profileImageSrc}
          alt=""
          fill
          sizes="40px"
          unoptimized={Boolean(profileImageUrl)}
          className={styles.avatar}
        />
        {presence ? (
          <span
            className={styles.presenceDot}
            data-online={presence.online}
            role="img"
            aria-label={presence.online ? "온라인" : "오프라인"}
          />
        ) : null}
      </span>

      <span className={styles.meta}>
        <span className={styles.nickname}>{nickname}</span>
      </span>
    </>
  );

  return (
    <li className={styles.card}>
      <div className={styles.summary}>
        {onSelect ? (
          <button
            type="button"
            className={styles.profileButton}
            aria-haspopup="dialog"
            aria-label={`${nickname} 프로필 보기`}
            onClick={(event) => onSelect(event.currentTarget)}
          >
            {profile}
          </button>
        ) : (
          <div className={styles.profile}>{profile}</div>
        )}

        {roomLink ? (
          <Link
            className={styles.roomAction}
            href={roomLink.href}
            aria-label={roomLink.label}
            aria-describedby={roomTooltipId}
          >
            <Image
              src="/icons/round_arrow.svg"
              alt=""
              width={16}
              height={16}
              className={styles.roomActionIcon}
            />
            <span
              id={roomTooltipId}
              className={styles.roomActionTooltip}
              role="tooltip"
            >
              따라가기
            </span>
          </Link>
        ) : null}
        {trailingAction ? (
          <div className={styles.trailingAction}>{trailingAction}</div>
        ) : null}
      </div>
    </li>
  );
}
