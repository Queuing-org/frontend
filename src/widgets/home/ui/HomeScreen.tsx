"use client";

import Image from "next/image";
import { useState } from "react";
import { useRoomsQuery } from "@/src/entities/room/hooks/useFetchRooms";
import type { Room } from "@/src/entities/room/model/types";
import RadialControl from "@/src/shared/ui/radial-control/RadialControl";
import HomeTopBar from "./HomeTopBar";
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
        <div className={styles.controlWrap}>
          <RadialControl
            ariaLabel="홈 하단 컨트롤"
            topItem={{ content: "MENU" }}
            leftItem={{
              ariaLabel: "이전 방 보기",
              content: (
                <Image
                  src="/icons/left_arrow.svg"
                  alt=""
                  width={20}
                  height={20}
                />
              ),
              onClick: previousRoom
                ? () => setCurrentRoomSlug(previousRoom.slug)
                : undefined,
              disabled: !previousRoom,
            }}
            rightItem={{
              ariaLabel: "다음 방 보기",
              content: (
                <Image
                  src="/icons/right_arrow.svg"
                  alt=""
                  width={20}
                  height={20}
                />
              ),
              onClick: nextRoom
                ? () => setCurrentRoomSlug(nextRoom.slug)
                : undefined,
              disabled: !nextRoom,
            }}
            centerItem={{
              ariaLabel: "방입장",
              href: `/room/${encodeURIComponent(currentRoom.slug)}`,
            }}
            bottomItem={{ content: "FILTER" }}
          />
        </div>
      ) : null}
    </div>
  );
}
