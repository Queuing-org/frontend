"use client";

import { useRef, useState, type PointerEvent } from "react";
import type { Room } from "@/src/features/room/model/types";
import { getRoomImageSrc } from "@/src/features/room/lib/getDefaultRoomImage";
import { useRoomWheelNavigation } from "@/src/shared/lib/useRoomWheelNavigation";
import RoomStageCard from "@/src/features/room/list/ui/RoomStageCard";
import styles from "./HomeRoomStage.module.css";

type RoomSlot =
  | "off-left"
  | "peek-prev"
  | "prev"
  | "current"
  | "next"
  | "peek-next"
  | "off-right";

type Props = {
  rooms: Room[];
  currentRoomSlug: string | null;
  onSelectRoom: (roomSlug: string) => void;
  onRequestRoomEntry: (room: Room) => void;
};

const DRAG_SELECT_THRESHOLD = 50;
const CLICK_SUPPRESS_THRESHOLD = 8;

function getRoomSlot(relativeIndex: number): RoomSlot {
  if (relativeIndex <= -3) return "off-left";
  if (relativeIndex === -2) return "peek-prev";
  if (relativeIndex === -1) return "prev";
  if (relativeIndex === 0) return "current";
  if (relativeIndex === 1) return "next";
  if (relativeIndex === 2) return "peek-next";
  return "off-right";
}

function isNavigableSlot(slot: RoomSlot) {
  return slot === "prev" || slot === "next";
}

export default function HomeRoomStage({
  rooms,
  currentRoomSlug,
  onSelectRoom,
  onRequestRoomEntry,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    pointerId: number;
  } | null>(null);
  const hasDragIntentRef = useRef(false);
  const suppressClickRef = useRef(false);
  const railRef = useRef<HTMLDivElement>(null);

  const currentIndex = rooms.findIndex((room) => room.slug === currentRoomSlug);
  const selectedIndex = currentIndex >= 0 ? currentIndex : 0;
  const previousRoom = selectedIndex > 0 ? rooms[selectedIndex - 1] : null;
  const nextRoom =
    selectedIndex < rooms.length - 1 ? rooms[selectedIndex + 1] : null;

  useRoomWheelNavigation({
    viewportRef: railRef,
    previousRoomSlug: previousRoom?.slug,
    nextRoomSlug: nextRoom?.slug,
    onSelectRoom,
  });

  if (rooms.length === 0) {
    return (
      <section className={styles.viewport} aria-label="방 선택 스테이지">
        <div className={styles.rail}>
          <div className={styles.emptyState}>방이 하나도 없어요😫</div>
        </div>
      </section>
    );
  }

  function suppressNextClick() {
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
    hasDragIntentRef.current = false;
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const dragStart = dragStartRef.current;

    if (!dragStart || hasDragIntentRef.current) {
      return;
    }

    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX <= CLICK_SUPPRESS_THRESHOLD || absX <= absY) {
      return;
    }

    hasDragIntentRef.current = true;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(dragStart.pointerId);
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    const dragStart = dragStartRef.current;
    const hadDragIntent = hasDragIntentRef.current;
    dragStartRef.current = null;
    hasDragIntentRef.current = false;
    setIsDragging(false);

    if (!dragStart) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(dragStart.pointerId)) {
      event.currentTarget.releasePointerCapture(dragStart.pointerId);
    }

    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (!hadDragIntent || absX <= CLICK_SUPPRESS_THRESHOLD || absX <= absY) {
      return;
    }

    suppressNextClick();

    if (absX < DRAG_SELECT_THRESHOLD) {
      return;
    }

    if (deltaX < 0 && nextRoom) {
      onSelectRoom(nextRoom.slug);
      return;
    }

    if (deltaX > 0 && previousRoom) {
      onSelectRoom(previousRoom.slug);
    }
  }

  function cancelDrag(event: PointerEvent<HTMLDivElement>) {
    const dragStart = dragStartRef.current;
    dragStartRef.current = null;
    hasDragIntentRef.current = false;
    setIsDragging(false);

    if (
      dragStart &&
      event.currentTarget.hasPointerCapture(dragStart.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(dragStart.pointerId);
    }
  }

  function handleCardClick(room: Room, slot: RoomSlot) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    if (slot === "current" || isNavigableSlot(slot)) {
      onRequestRoomEntry(room);
    }
  }

  return (
    <section className={styles.viewport} aria-label="방 선택 스테이지">
      <div
        ref={railRef}
        className={styles.rail}
        data-dragging={isDragging}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={cancelDrag}
      >
        {rooms.map((room, index) => {
          const slot = getRoomSlot(index - selectedIndex);
          const isSelected = slot === "current";
          const isNavigable = isNavigableSlot(slot);
          const canClick = isSelected || isNavigable;

          return (
            <div key={room.id} className={styles.slot} data-slot={slot}>
              <div className={styles.slotCard}>
                <RoomStageCard
                  slug={room.slug}
                  title={room.title}
                  imageSrc={getRoomImageSrc(room.thumbnailUrl, index)}
                  isSelected={isSelected}
                  disabled={!canClick}
                  ariaLabel={
                    isSelected
                      ? `${room.title} 방 입장`
                      : `${room.title} 방 선택`
                  }
                  onClick={
                    canClick ? () => handleCardClick(room, slot) : undefined
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
