"use client";

import Image from "next/image";
import type { FollowerUser } from "@/src/features/follow/model/types";
import styles from "./FollowerCard.module.css";

export default function FollowerCard({ user }: { user: FollowerUser }) {
  const profileImageSrc = user.profileImageUrl || "/Basic_Profile.png";

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
      </span>

      <div className={styles.meta}>
        <div className={styles.nickname}>{user.nickname}</div>
        <div className={styles.status}>나를 팔로우함</div>
      </div>
    </li>
  );
}
