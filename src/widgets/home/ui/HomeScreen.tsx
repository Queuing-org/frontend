"use client";

import { useState } from "react";
import { useRoomsQuery } from "@/src/entities/room/hooks/useFetchRooms";
import type { Room } from "@/src/entities/room/model/types";
import HomeTopBar from "./HomeTopBar";
import HomeBottomControl from "./HomeBottomControl";
import HomeRoomStage from "@/src/features/room/list/ui/HomeRoomStage";
import styles from "./HomeScreen.module.css";

export default function HomeScreen() {
  const { data, isLoading, isError, error } = useRoomsQuery();
  const rooms = data?.rooms ?? [];
  const [currentRoomSlug, setCurrentRoomSlug] = useState<string | null>(null);

  const currentRoom: Room | null =
    rooms.find((room) => room.slug === currentRoomSlug) ?? rooms[0] ?? null;

  const currentRoomIndex = currentRoom
    ? rooms.findIndex((room) => room.slug === currentRoom.slug)
    : -1;

  const previousRoom =
    currentRoomIndex > 0 ? rooms[currentRoomIndex - 1] : null;

  const nextRoom =
    currentRoomIndex >= 0 && currentRoomIndex < rooms.length - 1
      ? rooms[currentRoomIndex + 1]
      : null;

  if (isLoading) return <div>방 목록 로딩중...</div>;
  if (isError)
    return (
      <div>
        방 목록 가져오기에 실패했어요: ({error.status}) {error.message}
      </div>
    );

  return (
    <div className={styles.screen}>
      <HomeTopBar currentRoom={currentRoom} />
      <HomeRoomStage
        rooms={rooms}
        currentRoomSlug={currentRoom?.slug ?? null}
        onSelectRoom={setCurrentRoomSlug}
      />
      {currentRoom ? (
        <HomeBottomControl
          currentRoomSlug={currentRoom.slug}
          canGoPrevious={Boolean(previousRoom)}
          canGoNext={Boolean(nextRoom)}
          onGoPrevious={() => {
            if (previousRoom) {
              setCurrentRoomSlug(previousRoom.slug);
            }
          }}
          onGoNext={() => {
            if (nextRoom) {
              setCurrentRoomSlug(nextRoom.slug);
            }
          }}
        />
      ) : null}
    </div>
  );
}
