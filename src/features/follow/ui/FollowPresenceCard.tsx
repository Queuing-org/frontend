"use client";

import Image from "next/image";
import Link from "next/link";
import type { FollowUser } from "../model/types";
import styles from "./FollowPresenceCard.module.css";

type Props = {
  user: FollowUser;
};

export default function FollowPresenceCard({ user }: Props) {
  const profileImageSrc = user.profileImageUrl || "/Basic_Profile.png";
  const visibleRoom = user.online ? user.room : null;
  const statusText = visibleRoom
    ? `${visibleRoom.title} 참여 중`
    : user.online
      ? "온라인"
      : "오프라인";

  return (
    <li className={styles.card}>
      <span className={styles.avatarWrap}>
        <Image
          src={profileImageSrc}
          alt=""
          fill
          sizes="40px"
          unoptimized={Boolean(user.profileImageUrl)}
          className={styles.avatar}
        />
        <span
          className={styles.presenceDot}
          data-online={user.online}
          aria-hidden="true"
        />
      </span>

      <div className={styles.meta}>
        <div className={styles.nickname}>{user.nickname}</div>
        <div
          className={styles.status}
          data-in-room={Boolean(visibleRoom)}
          data-online={user.online}
        >
          {statusText}
        </div>
      </div>

      {visibleRoom ? (
        <Link
          className={styles.roomAction}
          href={`/room/${encodeURIComponent(visibleRoom.slug)}`}
          aria-label={`${visibleRoom.title} 방으로 이동`}
        >
          <Image
            src="/icons/round_arrow.svg"
            alt=""
            width={24}
            height={12}
          />
        </Link>
      ) : null}
    </li>
  );
}
