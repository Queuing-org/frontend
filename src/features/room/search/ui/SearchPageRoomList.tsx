"use client";

import type { CSSProperties } from "react";
import type { Room } from "@/src/entities/room/model/types";
import { useRoomWheelNavigation } from "@/src/shared/lib/useRoomWheelNavigation";
import SearchPageRoomCard from "@/src/entities/room/ui/SearchPageRoomCard";
import styles from "./SearchPageRoomList.module.css";

type Props = {
  rooms: Room[];
  selectedRoomSlug: string | null;
  onSelectRoom: (roomSlug: string) => void;
  onRequestRoomEntry: (room: Room) => void;
};

export function SearchPageRoomList({
  rooms,
  selectedRoomSlug,
  onSelectRoom,
  onRequestRoomEntry,
}: Props) {
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
            onClick={() => onRequestRoomEntry(room)}
          />
        ))}
      </div>
    </div>
  );
}
