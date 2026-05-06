"use client";

import Image from "next/image";
import type { ReceivedFollowRequest } from "../model/types";
import AcceptFollowRequestButton from "./AcceptFollowRequestButton";
import styles from "./FollowRequestCard.module.css";

export default function FollowRequestCard({
  item,
}: {
  item: ReceivedFollowRequest;
}) {
  const profileImageSrc =
    item.requesterProfileImageUrl || "/Basic_Profile.png";

  return (
    <div className={styles.card}>
      <span className={styles.avatarWrap}>
        <Image
          src={profileImageSrc}
          alt=""
          fill
          sizes="40px"
          unoptimized={Boolean(item.requesterProfileImageUrl)}
          className={styles.avatar}
        />
      </span>

      <div className={styles.meta}>
        <div className={styles.nickname}>{item.requesterNickname}</div>
        <div className={styles.status}>요청일: {item.createdAt}</div>
      </div>

      <div className={styles.action}>
        <AcceptFollowRequestButton requestId={item.requestId} />
      </div>
    </div>
  );
}
