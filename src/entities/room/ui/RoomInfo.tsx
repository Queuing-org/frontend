"use client";

import { useRoomMeta } from "@/src/entities/room/hooks/useRoomMeta";
import styles from "./RoomInfo.module.css";

type Props = {
  slug: string | null;
  isRoom?: boolean;
};

export default function RoomInfo({ slug, isRoom = false }: Props) {
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
      <div>태그 없음</div>
    );
  const usersCountContent = (
    <div className={styles.usersCount}>{activeUsersCount} 명</div>
  );
  const titleContent = <div className={styles.title}>{title}</div>;

  return (
    <div className={styles.roomInfoContainer}>
      {isRoom ? titleContent : tagsContent}
      {usersCountContent}
      {isRoom ? tagsContent : titleContent}
    </div>
  );
}
