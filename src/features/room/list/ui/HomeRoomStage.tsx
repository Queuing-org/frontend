"use client";

import type { Room } from "@/src/entities/room/model/types";
import { getDefaultRoomImage } from "@/src/entities/room/lib/getDefaultRoomImage";
import RoomStageCard from "@/src/entities/room/ui/RoomStageCard";
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
};

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
}: Props) {
  if (rooms.length === 0) {
    return (
      <section className={styles.viewport} aria-label="방 선택 스테이지">
        <div className={styles.rail}>
          <div className={styles.emptyState}>방이 하나도 없어요😫</div>
        </div>
      </section>
    );
  }

  const currentIndex = rooms.findIndex((room) => room.slug === currentRoomSlug);
  const selectedIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <section className={styles.viewport} aria-label="방 선택 스테이지">
      <div className={styles.rail}>
        {rooms.map((room, index) => {
          const slot = getRoomSlot(index - selectedIndex);
          const isSelected = slot === "current";
          const isNavigable = isNavigableSlot(slot);

          return (
            <div key={room.id} className={styles.slot} data-slot={slot}>
              <div className={styles.slotCard}>
                <RoomStageCard
                  slug={room.slug}
                  title={room.title}
                  imageSrc={getDefaultRoomImage(index)}
                  isSelected={isSelected}
                  disabled={!isNavigable}
                  onClick={
                    isNavigable ? () => onSelectRoom(room.slug) : undefined
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
