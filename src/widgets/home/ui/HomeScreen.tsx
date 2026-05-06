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
import { useRoomEntry } from "@/src/features/room/join/model/useRoomEntry";
import RoomJoinPasswordModal from "@/src/features/room/join/ui/RoomJoinPasswordModal";
import FollowModal from "@/src/features/follow/ui/FollowModal";
import styles from "./HomeScreen.module.css";

export default function HomeScreen() {
  const [roomListFilters, setRoomListFilters] =
    useState(DEFAULT_HOME_FILTERS);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
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
  const roomEntry = useRoomEntry({
    selectedRoomSlug,
    onSelectRoom: setCurrentRoomSlug,
  });

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
        onRequestRoomEntry={roomEntry.requestRoomEntry}
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
          onOpenFollow={() => setIsFollowModalOpen(true)}
          onEnterSelectedRoom={() => {
            if (currentRoom) {
              roomEntry.requestRoomEntry(currentRoom);
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
      <FollowModal
        open={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
      />
    </div>
  );
}
