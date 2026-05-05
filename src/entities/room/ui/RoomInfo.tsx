"use client";

import type { ReactNode } from "react";
import { useRoomMeta } from "@/src/entities/room/hooks/useRoomMeta";
import styles from "./RoomInfo.module.css";

type Props = {
  slug: string | null;
  isRoom?: boolean;
  trailingContent?: ReactNode;
};

export default function RoomInfo({
  slug,
  isRoom = false,
  trailingContent,
}: Props) {
  const { data: roomMeta, isLoading: isRoomMetaLoading, isError } =
    useRoomMeta(slug);
  const tags = roomMeta?.tags ?? [];
  const activeUsersCount =
    !slug || isRoomMetaLoading || isError
      ? "-"
      : (roomMeta?.activeUsersCount ?? "-");
  const title = !slug
    ? "선택된 방 없음"
    : isRoomMetaLoading || isError
      ? "-"
      : (roomMeta?.title ?? "선택된 방 없음");
  const tagsContent =
    tags.length > 0 ? (
      <div className={styles.tag}>
        {tags.map((tag) => (
          <span key={tag.slug} className={styles.tagItem}>
            {tag.name}
          </span>
        ))}
      </div>
    ) : (
      <div className={styles.tag}>
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
