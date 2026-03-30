"use client";

import Image from "next/image";
import Link from "next/link";
import { useRoomsQuery } from "@/src/entities/room/hooks/useFetchRooms";
import { useRoomNavigator } from "@/src/shared/lib/useRoomNavigator";
import RadialControl from "@/src/shared/ui/radial-control/RadialControl";
import HomeTopBar from "./HomeTopBar";
import HomeRoomStage from "@/src/features/room/list/ui/HomeRoomStage";
import styles from "./HomeScreen.module.css";

export default function HomeScreen() {
  const { data, isLoading, isError, error } = useRoomsQuery();
  const rooms = data?.rooms ?? [];
  const {
    currentRoom,
    selectedRoomSlug,
    setCurrentRoomSlug,
    previousRoom,
    nextRoom,
    goPrevious,
    goNext,
  } = useRoomNavigator(rooms);

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
        currentRoomSlug={selectedRoomSlug}
        onSelectRoom={setCurrentRoomSlug}
      />
      {currentRoom ? (
        <div className={styles.controlWrap}>
          <RadialControl
            ariaLabel="홈 하단 컨트롤"
            top={<span>MENU</span>}
            left={
              <button
                type="button"
                onClick={goPrevious}
                disabled={!previousRoom}
                aria-label="이전 방 보기"
              >
                <Image
                  src="/icons/left_arrow.svg"
                  alt=""
                  width={20}
                  height={20}
                />
              </button>
            }
            center={
              <Link
                href={`/room/${encodeURIComponent(selectedRoomSlug ?? "")}`}
                aria-label="방입장"
              />
            }
            right={
              <button
                type="button"
                onClick={goNext}
                disabled={!nextRoom}
                aria-label="다음 방 보기"
              >
                <Image
                  src="/icons/right_arrow.svg"
                  alt=""
                  width={20}
                  height={20}
                />
              </button>
            }
            bottom={<span>FILTER</span>}
          />
        </div>
      ) : null}
    </div>
  );
}
