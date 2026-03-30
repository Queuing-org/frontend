"use client";

import { useRoomsQuery } from "@/src/entities/room/hooks/useFetchRooms";
import { useRoomNavigator } from "@/src/shared/lib/useRoomNavigator";
import { SearchPageRoomList } from "@/src/features/room/search/ui/SearchPageRoomList";
import MainLogo from "@/src/widgets/home/ui/MainLogo";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import RadialControl from "@/src/shared/ui/radial-control/RadialControl";
import RoomSearchBadge from "@/src/features/room/search/ui/RoomSearchBadge";
import RoomSearchInput from "@/src/features/room/search/ui/RoomSearchInput";

export default function SearchPage() {
  const { data } = useRoomsQuery();
  const rooms = data?.rooms ?? [];
  const { selectedRoomSlug, previousRoom, nextRoom, goPrevious, goNext } =
    useRoomNavigator(rooms);

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <MainLogo />
      </div>

      <div className={styles.list_container}>
        <div className={styles.search_badge}>
          <RoomSearchBadge />
        </div>
        <div className={styles.search_input}>
          <RoomSearchInput />
        </div>
        <div className={styles.room_list}>
          <SearchPageRoomList
            rooms={rooms}
            selectedRoomSlug={selectedRoomSlug}
          />
        </div>
        {selectedRoomSlug ? (
          <div className={styles.controlWrap}>
            <RadialControl
              ariaLabel="검색 페이지 방 이동 컨트롤"
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
                  href={`/room/${encodeURIComponent(selectedRoomSlug)}`}
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

      <div className={styles.thumbnail_container}>
        <Image
          src="/Thumbnail.png"
          alt="룸 썸네일"
          fill
          className={styles.thumbnail}
          priority
        />
      </div>
    </div>
  );
}
