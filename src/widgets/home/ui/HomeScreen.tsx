"use client";

import { useState } from "react";
import { useRoomsQuery } from "@/src/entities/room/hooks/useFetchRooms";
import { useRoomNavigator } from "@/src/shared/lib/useRoomNavigator";
import {
  DEFAULT_HOME_FILTERS,
  getNextHomeFilters,
  type HomeFilterKey,
  type HomeFilterOption,
} from "./HomeControlPanelShell";
import HomeTopBar from "./HomeTopBar";
import HomeSearchControlDock from "./HomeSearchControlDock";
import HomeRoomStage from "@/src/features/room/list/ui/HomeRoomStage";
import RoomFormModal from "@/src/features/room/create/ui/RoomFormModal";
import styles from "./HomeScreen.module.css";

export default function HomeScreen() {
  const [roomListFilters, setRoomListFilters] =
    useState(DEFAULT_HOME_FILTERS);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
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

  const selectRoomListFilter = (
    key: HomeFilterKey,
    option: HomeFilterOption,
  ) => {
    setRoomListFilters((currentFilters) =>
      getNextHomeFilters(currentFilters, key, option),
    );
  };

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
        isLoading={isLoading}
      />
      {!isLoading ? (
        <HomeSearchControlDock
          ariaLabel="홈 하단 컨트롤"
          selectedRoomSlug={selectedRoomSlug}
          canGoPrevious={Boolean(previousRoom)}
          canGoNext={Boolean(nextRoom)}
          activeFilters={roomListFilters}
          onGoPrevious={goPrevious}
          onGoNext={goNext}
          onSelectFilter={selectRoomListFilter}
          onCreateRoom={() => setIsCreateRoomModalOpen(true)}
        />
      ) : null}
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
