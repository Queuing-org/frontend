"use client";

import Image from "next/image";
import type { FollowingUser } from "@/src/entities/follow/model/types";
import UnfollowButton from "../../unfollow/ui/UnfollowButton";
import styles from "./FollowingCard.module.css";

export default function FollowingCard({ user }: { user: FollowingUser }) {
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
        <div className={styles.status}>온라인</div>
      </div>

      <div className={styles.action}>
        <UnfollowButton targetSlug={user.slug} />
      </div>
    </li>
  );
}
