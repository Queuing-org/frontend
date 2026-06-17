"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import type { RoomTag } from "@/src/features/room/model/types";
import styles from "./RoomInfo.module.css";

export type RoomInfoDisplay = {
  activeUsersCount?: number | null;
  hasPassword: boolean;
  tags: RoomTag[];
  title: string;
};

type Props = {
  roomInfo: RoomInfoDisplay | null;
  isRoom?: boolean;
  trailingContent?: ReactNode;
};

export default function RoomInfo({
  roomInfo,
  isRoom = false,
  trailingContent,
}: Props) {
  const tags = roomInfo?.tags ?? [];
  const activeUsersCount =
    typeof roomInfo?.activeUsersCount === "number"
      ? roomInfo.activeUsersCount
      : "-";
  const title = roomInfo?.title ?? "선택된 방 없음";
  const lockContent = roomInfo?.hasPassword ? (
    <Image
      src="/icons/lock.svg"
      alt="비밀번호 방"
      width={14}
      height={18}
      className={styles.lockIcon}
    />
  ) : null;
  const tagsContent =
    tags.length > 0 ? (
      <div className={styles.tag}>
        {lockContent}
        {tags.map((tag) => (
          <span key={tag.slug} className={styles.tagItem}>
            {tag.name}
          </span>
        ))}
      </div>
    ) : (
      <div className={styles.tag}>
        {lockContent}
        <span className={styles.tagItem}>태그없음</span>
      </div>
    );
  const usersCountContent = (
    <div className={styles.usersCount}>{activeUsersCount} 명</div>
  );
  const titleContent = <div className={styles.title}>{title}</div>;
  const containerClassName = [
    styles.roomInfoContainer,
    isRoom ? styles.roomInfoContainerRoom : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName}>
      <div className={styles.roomInfoMain}>
        {isRoom ? titleContent : tagsContent}
        {usersCountContent}
        {isRoom ? tagsContent : titleContent}
      </div>
      {trailingContent}
    </div>
  );
}
