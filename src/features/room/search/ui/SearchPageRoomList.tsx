"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Room } from "@/src/entities/room/model/types";
import SearchPageRoomCard from "@/src/entities/room/ui/SearchPageRoomCard";
import styles from "./SearchPageRoomList.module.css";

type Props = {
  rooms: Room[];
  selectedRoomSlug: string | null;
};

const DEFAULT_ROOM_LIST_HEIGHT = 558;
const ROOM_CARD_HEIGHT = 77;
const ROOM_CARD_GAP = 12;
const ROOM_STEP = ROOM_CARD_HEIGHT + ROOM_CARD_GAP;

export function SearchPageRoomList({ rooms, selectedRoomSlug }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(DEFAULT_ROOM_LIST_HEIGHT);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const updateViewportHeight = () => {
      setViewportHeight(Math.round(viewport.clientHeight));
    };

    updateViewportHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateViewportHeight();
    });

    resizeObserver.observe(viewport);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const currentIndex = rooms.findIndex(
    (room) => room.slug === selectedRoomSlug,
  );
  const selectedIndex = currentIndex >= 0 ? currentIndex : 0;
  const viewportPadding = Math.max(
    (viewportHeight - ROOM_CARD_HEIGHT) / 2,
    0,
  );
  const translateY = -(selectedIndex * ROOM_STEP);

  if (rooms.length === 0) {
    return (
      <div
        ref={viewportRef}
        className={styles.viewport}
        aria-label="검색 방 목록"
      >
        <div className={styles.emptyState}>방이 하나도 없어요😫</div>
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      className={styles.viewport}
      style={
        {
          "--room-card-height": `${ROOM_CARD_HEIGHT}px`,
          "--room-card-gap": `${ROOM_CARD_GAP}px`,
          "--room-viewport-padding": `${viewportPadding}px`,
        } as CSSProperties
      }
      aria-label="검색 방 목록"
    >
      <div
        className={styles.track}
        style={{ transform: `translateY(${translateY}px)` }}
      >
        {rooms.map((room, index) => (
          <SearchPageRoomCard
            key={room.id}
            slug={room.slug}
            title={room.title}
            tag={room.tags}
            isSelected={room.slug === (rooms[selectedIndex]?.slug ?? null)}
            distance={Math.abs(index - selectedIndex)}
          />
        ))}
      </div>
    </div>
  );
}
