"use client";

import { useRef, type CSSProperties } from "react";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import type { Room } from "@/src/features/room/model/types";
import { useRoomWheelNavigation } from "@/src/shared/lib/useRoomWheelNavigation";
import SearchPageRoomCard from "@/src/features/room/search/ui/SearchPageRoomCard";
import styles from "./SearchPageRoomList.module.css";

type Props = {
  errorMessage?: string | null;
  isLoading?: boolean;
  onRetry?: () => void;
  rooms: Room[];
  selectedRoomSlug: string | null;
  onSelectRoom: (roomSlug: string) => void;
  onRequestRoomEntry: (room: Room) => void;
};

export function SearchPageRoomList({
  errorMessage,
  isLoading = false,
  onRetry,
  rooms,
  selectedRoomSlug,
  onSelectRoom,
  onRequestRoomEntry,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const currentIndex = rooms.findIndex(
    (room) => room.slug === selectedRoomSlug,
  );
  const selectedIndex = currentIndex >= 0 ? currentIndex : 0;
  const previousRoom = selectedIndex > 0 ? rooms[selectedIndex - 1] : null;
  const nextRoom =
    selectedIndex < rooms.length - 1 ? rooms[selectedIndex + 1] : null;

  useRoomWheelNavigation({
    viewportRef,
    previousRoomSlug: previousRoom?.slug,
    nextRoomSlug: nextRoom?.slug,
    onSelectRoom,
  });

  if (isLoading) {
    return (
      <div className={styles.viewport} aria-label="검색 방 목록">
        <div className={styles.loadingState}>
          <LoadingSpinner ariaLabel="방 목록 로딩 중" size={28} />
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={styles.viewport} aria-label="검색 방 목록">
        <div className={styles.errorState} role="alert">
          <span>{errorMessage}</span>
          {onRetry ? (
            <button
              type="button"
              className={styles.retryButton}
              onClick={onRetry}
            >
              다시 시도
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className={styles.viewport} aria-label="검색 방 목록">
        <div className={styles.emptyState}>검색 결과가 없습니다.</div>
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      className={styles.viewport}
      style={
        {
          "--selected-index": selectedIndex,
        } as CSSProperties
      }
      aria-label="검색 방 목록"
    >
      <div className={styles.track}>
        <div className={styles.selectionHighlight} aria-hidden="true" />
        {rooms.map((room) => (
          <SearchPageRoomCard
            key={room.id}
            room={room}
            isSelected={room.slug === selectedRoomSlug}
            onRequestRoomEntry={onRequestRoomEntry}
          />
        ))}
      </div>
    </div>
  );
}
