"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./FollowUserCard.module.css";

type Props = {
  nickname: string;
  onSelect?: (trigger: HTMLButtonElement) => void;
  presence?: {
    inRoom: boolean;
    online: boolean;
    text: string;
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
            aria-hidden="true"
          />
        ) : null}
      </span>

      <span className={styles.meta}>
        <span className={styles.nickname}>{nickname}</span>
        {presence ? (
          <span
            className={styles.status}
            data-in-room={presence.inRoom}
            data-online={presence.online}
          >
            {presence.text}
          </span>
        ) : null}
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
          >
            <Image
              src="/icons/round_arrow.svg"
              alt=""
              width={24}
              height={12}
            />
          </Link>
        ) : null}
        {trailingAction ? (
          <div className={styles.trailingAction}>{trailingAction}</div>
        ) : null}
      </div>
    </li>
  );
}
