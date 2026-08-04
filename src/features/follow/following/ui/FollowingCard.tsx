"use client";

import Image from "next/image";
import Link from "next/link";
import type { FollowingUser } from "@/src/features/follow/model/types";
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
        <div className={styles.status} data-online={user.online}>
          {user.online ? "온라인" : "오프라인"}
          {user.online && user.room ? (
            <>
              <span aria-hidden="true"> · </span>
              <Link
                className={styles.roomLink}
                href={`/room/${encodeURIComponent(user.room.slug)}`}
              >
                {user.room.title}
              </Link>
            </>
          ) : null}
        </div>
      </div>

      <div className={styles.action}>
        <UnfollowButton targetSlug={user.slug} />
      </div>
    </li>
  );
}
