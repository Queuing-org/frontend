"use client";

import { useMemo, useState } from "react";
import {
  getRoomsFromPages,
  useRoomsQuery,
} from "@/src/features/room/hooks/useFetchRooms";
import QueryBoundary from "@/src/shared/ui/query-boundary/QueryBoundary";
import { useMediaQuery } from "@/src/shared/lib/useMediaQuery";
import { useRoomNavigator } from "@/src/shared/lib/useRoomNavigator";
import { useLoadMoreRoomsNearEnd } from "@/src/shared/lib/useLoadMoreRoomsNearEnd";
import { useAuthenticatedAction } from "@/src/shared/lib/useAuthenticatedAction";
import {
  DEFAULT_HOME_FILTERS,
  getNextHomeFilters,
  type HomeFilterKey,
  type HomeFilterOption,
} from "./HomeControlPanelShell";
import HomeTopBar from "./HomeTopBar";
import HomeSearchControlDock from "./HomeSearchControlDock";
import MobileHomeRoomFeed from "./MobileHomeRoomFeed";
import HomeRoomStage from "@/src/features/room/list/ui/HomeRoomStage";
import RoomFormModal from "@/src/features/room/create/ui/RoomFormModal";
import { redirectToGoogleLogin } from "@/src/features/auth/login-with-google/api/login";
import { useRoomEntry } from "@/src/features/room/join/model/useRoomEntry";
import RoomJoinPasswordModal from "@/src/features/room/join/ui/RoomJoinPasswordModal";
import FollowModal from "@/src/features/follow/ui/FollowModal";
import SettingsModal from "@/src/features/settings/ui/SettingsModal";
import AuthRequiredModal from "@/src/shared/ui/auth-required/AuthRequiredModal";
import styles from "./HomeScreen.module.css";

export default function HomeScreen() {
  const isMobileLayout = useMediaQuery("(max-width: 760px)");
  const [roomListFilters, setRoomListFilters] =
    useState(DEFAULT_HOME_FILTERS);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const {
    authRequiredDescription,
    closeAuthRequiredModal,
    isAuthRequiredModalOpen,
    requestAuthenticatedAction,
  } = useAuthenticatedAction("방 만들기는 로그인 후 이용할 수 있어요.");
  const selectRoomListFilter = (
    key: HomeFilterKey,
    option: HomeFilterOption,
  ) => {
    setRoomListFilters((currentFilters) =>
      getNextHomeFilters(currentFilters, key, option),
    );
  };

  const requestCreateRoom = () =>
    requestAuthenticatedAction({
      description: "방 만들기는 로그인 후 이용할 수 있어요.",
      onAuthenticated: () => setIsCreateRoomModalOpen(true),
    });

  const requestOpenFollow = () =>
    requestAuthenticatedAction({
      description: "팔로우 기능은 로그인 후 이용할 수 있어요.",
      onAuthenticated: () => setIsFollowModalOpen(true),
    });

  const requestOpenSettings = () =>
    requestAuthenticatedAction({
      description: "설정은 로그인 후 이용할 수 있어요.",
      onAuthenticated: () => setIsSettingsModalOpen(true),
    });

  return (
    <div className={styles.screen}>
      <QueryBoundary
        fallback={<div className={styles.statePanel}>방 목록 로딩 중...</div>}
        errorTitle="방 목록을 불러오지 못했어요."
        resetKeys={[isMobileLayout]}
      >
        <HomeRoomsContent
          activeFilters={roomListFilters}
          isMobileLayout={isMobileLayout}
          mobileSearchQuery={mobileSearchQuery}
          onCreateRoom={requestCreateRoom}
          onMobileSearchQueryChange={setMobileSearchQuery}
          onOpenFollow={requestOpenFollow}
          onOpenSettings={requestOpenSettings}
          onSelectFilter={selectRoomListFilter}
        />
      </QueryBoundary>
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
      <SettingsModal
        open={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
      <AuthRequiredModal
        open={isAuthRequiredModalOpen}
        description={authRequiredDescription}
        onClose={closeAuthRequiredModal}
        onLogin={redirectToGoogleLogin}
      />
    </div>
  );
}

type HomeRoomsContentProps = {
  activeFilters: typeof DEFAULT_HOME_FILTERS;
  isMobileLayout: boolean;
  mobileSearchQuery: string;
  onCreateRoom: () => void;
  onMobileSearchQueryChange: (query: string) => void;
  onOpenFollow: () => void;
  onOpenSettings: () => void;
  onSelectFilter: (key: HomeFilterKey, option: HomeFilterOption) => void;
};

function HomeRoomsContent({
  activeFilters,
  isMobileLayout,
  mobileSearchQuery,
  onCreateRoom,
  onMobileSearchQueryChange,
  onOpenFollow,
  onOpenSettings,
  onSelectFilter,
}: HomeRoomsContentProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useRoomsQuery();
  const rooms = useMemo(() => getRoomsFromPages(data), [data]);
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

  useLoadMoreRoomsNearEnd({
    rooms,
    selectedRoomSlug,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage,
  });

  return (
    <>
      <HomeTopBar
        currentRoom={currentRoom}
        mobileSearchQuery={mobileSearchQuery}
        onMobileSearchQueryChange={onMobileSearchQueryChange}
      />
      {isMobileLayout ? (
        <MobileHomeRoomFeed
          activeFilters={activeFilters}
          hasNextPage={Boolean(hasNextPage)}
          isFetchingNextPage={isFetchingNextPage}
          onCreateRoom={onCreateRoom}
          onLoadMoreRooms={() => {
            void fetchNextPage();
          }}
          onOpenFollow={onOpenFollow}
          onOpenSettings={onOpenSettings}
          onRequestRoomEntry={roomEntry.requestRoomEntry}
          onSelectFilter={onSelectFilter}
          onSelectRoom={setCurrentRoomSlug}
          rooms={rooms}
          selectedRoomSlug={selectedRoomSlug}
        />
      ) : null}
      {!isMobileLayout ? (
        <>
          <HomeRoomStage
            rooms={rooms}
            currentRoomSlug={selectedRoomSlug}
            onSelectRoom={setCurrentRoomSlug}
            onRequestRoomEntry={roomEntry.requestRoomEntry}
          />
          <HomeSearchControlDock
            ariaLabel="홈 하단 컨트롤"
            selectedRoomSlug={selectedRoomSlug}
            canGoPrevious={Boolean(previousRoom)}
            canGoNext={Boolean(nextRoom)}
            activeFilters={activeFilters}
            onGoPrevious={goPrevious}
            onGoNext={goNext}
            onSelectFilter={onSelectFilter}
            onCreateRoom={onCreateRoom}
            onOpenFollow={onOpenFollow}
            onOpenSettings={onOpenSettings}
            onEnterSelectedRoom={() => {
              if (currentRoom) {
                roomEntry.requestRoomEntry(currentRoom);
              }
            }}
          />
        </>
      ) : null}
      <RoomJoinPasswordModal
        room={roomEntry.passwordRoom}
        onClose={roomEntry.closePasswordModal}
        onJoined={roomEntry.completePasswordEntry}
      />
    </>
  );
}
