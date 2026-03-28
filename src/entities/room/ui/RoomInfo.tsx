"use client";

import { useRoomMeta } from "@/src/entities/room/hooks/useRoomMeta";
import type { Room } from "@/src/entities/room/model/types";
import styles from "./RoomInfo.module.css";

type Props = {
  currentRoom: Room | null;
};

export default function RoomInfo({ currentRoom }: Props) {
  const { data: roomMeta, isLoading: isRoomMetaLoading } = useRoomMeta(
    currentRoom?.slug ?? null,
  );
  const tags = currentRoom?.tags ?? [];
  const activeUsersCount = isRoomMetaLoading
    ? "-"
    : (roomMeta?.activeUsersCount ?? "-");

  return (
    <div className={styles.roomInfoContainer}>
      {tags.length > 0 ? (
        <div className={styles.tag}>
          {tags.map((tag) => (
            <span key={tag.slug} className={styles.tagItem}>
              {tag.name}
            </span>
          ))}
        </div>
      ) : (
        <div>태그 없음</div>
      )}

      <div className={styles.usersCount}>{activeUsersCount} 명</div>

      <div className={styles.title}>
        {currentRoom?.title ?? "선택된 방 없음"}
      </div>
    </div>
  );
}
