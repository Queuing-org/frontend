"use client";

import { useState } from "react";
import { useRoomsQuery } from "@/src/entities/room/hooks/useFetchRooms";
import type { Room } from "@/src/entities/room/model/types";
import HomeTopBar from "./HomeTopBar";
import HomeRoomStage from "@/src/features/room/list/ui/HomeRoomStage";
import styles from "./HomeScreen.module.css";

export default function HomeScreen() {
  const { data, isLoading, isError, error } = useRoomsQuery();
  const rooms = data?.rooms ?? [];
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);

  const currentRoom: Room | null =
    rooms.find((room) => room.id === currentRoomId) ?? rooms[0] ?? null;

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
        currentRoomId={currentRoom?.id ?? null}
        onSelectRoom={setCurrentRoomId}
      />
    </div>
  );
}
