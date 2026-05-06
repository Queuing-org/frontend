"use client";

import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import type { Room } from "@/src/entities/room/model/types";
import { useRoomWheelNavigation } from "@/src/shared/lib/useRoomWheelNavigation";
import SearchPageRoomCard from "@/src/entities/room/ui/SearchPageRoomCard";
import styles from "./SearchPageRoomList.module.css";

type Props = {
  rooms: Room[];
  selectedRoomSlug: string | null;
  onSelectRoom: (roomSlug: string) => void;
};

export function SearchPageRoomList({
  rooms,
  selectedRoomSlug,
  onSelectRoom,
}: Props) {
  const router = useRouter();
  const currentIndex = rooms.findIndex(
    (room) => room.slug === selectedRoomSlug,
  );
  const selectedIndex = currentIndex >= 0 ? currentIndex : 0;
  const previousRoom = selectedIndex > 0 ? rooms[selectedIndex - 1] : null;
  const nextRoom =
    selectedIndex < rooms.length - 1 ? rooms[selectedIndex + 1] : null;
  const handleWheel = useRoomWheelNavigation({
    previousRoomSlug: previousRoom?.slug,
    nextRoomSlug: nextRoom?.slug,
    onSelectRoom,
  });

  function handleCardClick(room: Room) {
    if (room.slug === selectedRoomSlug) {
      router.push(`/room/${encodeURIComponent(room.slug)}`);
      return;
    }

    onSelectRoom(room.slug);
  }

  if (rooms.length === 0) {
    return (
      <div className={styles.viewport} aria-label="검색 방 목록">
        <div className={styles.emptyState}>방이 하나도 없어요😫</div>
      </div>
    );
  }

  return (
    <div
      className={styles.viewport}
      style={
        {
          "--selected-index": selectedIndex,
        } as CSSProperties
      }
      aria-label="검색 방 목록"
      onWheel={handleWheel}
    >
      <div className={styles.track}>
        <div className={styles.selectionHighlight} aria-hidden="true" />
        {rooms.map((room) => (
          <SearchPageRoomCard
            key={room.id}
            slug={room.slug}
            title={room.title}
            tag={room.tags}
            isSelected={room.slug === selectedRoomSlug}
            onClick={() => handleCardClick(room)}
          />
        ))}
      </div>
    </div>
  );
}
