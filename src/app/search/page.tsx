"use client";

import { useState } from "react";
import { useRoomsQuery } from "@/src/entities/room/hooks/useFetchRooms";
import { getDefaultRoomImage } from "@/src/entities/room/lib/getDefaultRoomImage";
import { useRoomNavigator } from "@/src/shared/lib/useRoomNavigator";
import { SearchPageRoomList } from "@/src/features/room/search/ui/SearchPageRoomList";
import MainLogo from "@/src/widgets/home/ui/MainLogo";
import styles from "./page.module.css";
import Image from "next/image";
import RoomSearchInput from "@/src/features/room/search/ui/RoomSearchInput";
import { ClipLoader } from "react-spinners";
import {
  DEFAULT_HOME_FILTERS,
  getNextHomeFilters,
  type HomeFilterKey,
  type HomeFilterOption,
} from "@/src/widgets/home/ui/HomeControlPanelShell";
import HomeSearchControlDock from "@/src/widgets/home/ui/HomeSearchControlDock";
import RoomFormModal from "@/src/features/room/create/ui/RoomFormModal";
import { useRoomEntry } from "@/src/features/room/join/model/useRoomEntry";
import RoomJoinPasswordModal from "@/src/features/room/join/ui/RoomJoinPasswordModal";

export default function SearchPage() {
  const [roomListFilters, setRoomListFilters] = useState(DEFAULT_HOME_FILTERS);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const { data, isLoading, isError } = useRoomsQuery();
  const rooms = data?.rooms ?? [];
  const roomListRooms = rooms;
  const {
    selectedRoomSlug,
    setCurrentRoomSlug,
    previousRoom,
    nextRoom,
    goPrevious,
    goNext,
  } = useRoomNavigator(roomListRooms);
  const roomEntry = useRoomEntry({
    selectedRoomSlug,
    onSelectRoom: setCurrentRoomSlug,
  });
  const selectedRoomIndex = selectedRoomSlug
    ? roomListRooms.findIndex((room) => room.slug === selectedRoomSlug)
    : -1;
  const selectedRoom =
    selectedRoomIndex >= 0 ? roomListRooms[selectedRoomIndex] : null;
  const backgroundImageSrc = getDefaultRoomImage(
    selectedRoomIndex >= 0 ? selectedRoomIndex : 0,
  );

  const selectRoomListFilter = (
    key: HomeFilterKey,
    option: HomeFilterOption,
  ) => {
    setRoomListFilters((currentFilters) =>
      getNextHomeFilters(currentFilters, key, option),
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <MainLogo />
      </div>

      <div className={styles.list_container}>
        <div className={styles.listContent}>
          <div className={styles.search_input}>
            <RoomSearchInput />
          </div>
          <div className={styles.room_list}>
            {isLoading ? (
              <div className={styles.statePanel}>
                <ClipLoader color="#ffffff" size={36} aria-label="로딩 중" />
              </div>
            ) : isError ? (
              <div className={styles.statePanel}>새로고침을 시도해주세요.</div>
            ) : (
              <SearchPageRoomList
                rooms={roomListRooms}
                selectedRoomSlug={selectedRoomSlug}
                onSelectRoom={setCurrentRoomSlug}
                onRequestRoomEntry={roomEntry.requestRoomEntry}
              />
            )}
          </div>
        </div>

        <div className={styles.thumbnail_container}>
          <Image
            key={backgroundImageSrc}
            src={backgroundImageSrc}
            alt={
              selectedRoom
                ? `${selectedRoom.title} 대표 이미지`
                : "방 대표 이미지"
            }
            fill
            className={styles.thumbnail}
            priority
          />
        </div>
      </div>

      {!isLoading && !isError ? (
        <HomeSearchControlDock
          ariaLabel="검색 페이지 방 이동 컨트롤"
          selectedRoomSlug={selectedRoomSlug}
          canGoPrevious={Boolean(previousRoom)}
          canGoNext={Boolean(nextRoom)}
          activeFilters={roomListFilters}
          onGoPrevious={goPrevious}
          onGoNext={goNext}
          onSelectFilter={selectRoomListFilter}
          onCreateRoom={() => setIsCreateRoomModalOpen(true)}
          onEnterSelectedRoom={() => {
            if (selectedRoom) {
              roomEntry.requestRoomEntry(selectedRoom);
            }
          }}
        />
      ) : null}

      <RoomJoinPasswordModal
        room={roomEntry.passwordRoom}
        onClose={roomEntry.closePasswordModal}
        onJoined={roomEntry.completePasswordEntry}
      />
      {isCreateRoomModalOpen ? (
        <RoomFormModal
          open
          mode="create"
          onClose={() => setIsCreateRoomModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
