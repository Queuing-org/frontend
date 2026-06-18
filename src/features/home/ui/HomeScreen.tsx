"use client";

import { useMemo, useState } from "react";
import {
  getRoomsFromPages,
  normalizeRoomsQueryParams,
  type RoomsQueryParams,
  useRoomsQuery,
} from "@/src/features/room/hooks/useFetchRooms";
import { useRoomTagsQuery } from "@/src/features/room/hooks/useRoomTags";
import { useMediaQuery } from "@/src/shared/lib/useMediaQuery";
import { useRoomNavigator } from "@/src/shared/lib/useRoomNavigator";
import { useLoadMoreRoomsNearEnd } from "@/src/shared/lib/useLoadMoreRoomsNearEnd";
import { useAuthenticatedAction } from "@/src/shared/lib/useAuthenticatedAction";
import { useDebouncedValue } from "@/src/shared/lib/useDebouncedValue";
import {
  DEFAULT_HOME_FILTERS,
  getHomeGenreFilterOptions,
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
  const debouncedMobileSearchQuery = useDebouncedValue(mobileSearchQuery, 300);
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
  const roomListQueryParams = useMemo(
    () =>
      normalizeRoomsQueryParams({
        createdOrder: roomListFilters.date,
        keyword: isMobileLayout ? debouncedMobileSearchQuery : undefined,
        participantOrder: roomListFilters.participants,
      }),
    [
      debouncedMobileSearchQuery,
      isMobileLayout,
      roomListFilters.date,
      roomListFilters.participants,
    ],
  );

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
  const hasPageModalOpen =
    isCreateRoomModalOpen ||
    isFollowModalOpen ||
    isSettingsModalOpen ||
    isAuthRequiredModalOpen;

  return (
    <div className={styles.screen}>
      <HomeRoomsContent
        activeFilters={roomListFilters}
        hasPageModalOpen={hasPageModalOpen}
        isMobileLayout={isMobileLayout}
        mobileSearchQuery={mobileSearchQuery}
        onCreateRoom={requestCreateRoom}
        onMobileSearchQueryChange={setMobileSearchQuery}
        onOpenFollow={requestOpenFollow}
        onOpenSettings={requestOpenSettings}
        onSelectFilter={selectRoomListFilter}
        roomsQueryParams={roomListQueryParams}
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
  hasPageModalOpen: boolean;
  isMobileLayout: boolean;
  mobileSearchQuery: string;
  onCreateRoom: () => void;
  onMobileSearchQueryChange: (query: string) => void;
  onOpenFollow: () => void;
  onOpenSettings: () => void;
  onSelectFilter: (key: HomeFilterKey, option: HomeFilterOption) => void;
  roomsQueryParams: RoomsQueryParams;
};

function HomeRoomsContent({
  activeFilters,
  hasPageModalOpen,
  isMobileLayout,
  mobileSearchQuery,
  onCreateRoom,
  onMobileSearchQueryChange,
  onOpenFollow,
  onOpenSettings,
  onSelectFilter,
  roomsQueryParams,
}: HomeRoomsContentProps) {
  const roomTagsQuery = useRoomTagsQuery();
  const genreOptions = useMemo(
    () =>
      getHomeGenreFilterOptions({
        isError: roomTagsQuery.isError,
        isLoading: roomTagsQuery.isLoading,
        tags: roomTagsQuery.data,
      }),
    [roomTagsQuery.data, roomTagsQuery.isError, roomTagsQuery.isLoading],
  );
  const roomsQuery = useRoomsQuery(roomsQueryParams);
  const rooms = useMemo(() => getRoomsFromPages(roomsQuery.data), [
    roomsQuery.data,
  ]);
  const roomListErrorMessage = roomsQuery.isError
    ? roomsQuery.error.message || "잠시 후 다시 시도해 주세요."
    : null;
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
  const isChromeReduced = hasPageModalOpen || Boolean(roomEntry.passwordRoom);

  useLoadMoreRoomsNearEnd({
    rooms,
    selectedRoomSlug,
    hasNextPage: Boolean(roomsQuery.hasNextPage),
    isFetchingNextPage: roomsQuery.isFetchingNextPage,
    fetchNextPage: roomsQuery.fetchNextPage,
  });

  return (
    <>
      <HomeTopBar
        currentRoom={currentRoom}
        isChromeReduced={isChromeReduced}
        mobileSearchQuery={mobileSearchQuery}
        onMobileSearchQueryChange={onMobileSearchQueryChange}
      />
      {isMobileLayout && !isChromeReduced ? (
        <MobileHomeRoomFeed
          activeFilters={activeFilters}
          errorMessage={roomListErrorMessage}
          genreOptions={genreOptions}
          hasNextPage={Boolean(roomsQuery.hasNextPage)}
          isFetchingNextPage={roomsQuery.isFetchingNextPage}
          isLoading={roomsQuery.isPending}
          onCreateRoom={onCreateRoom}
          onLoadMoreRooms={() => {
            void roomsQuery.fetchNextPage();
          }}
          onOpenFollow={onOpenFollow}
          onOpenSettings={onOpenSettings}
          onRetry={() => {
            void roomsQuery.refetch();
          }}
          onRequestRoomEntry={roomEntry.requestRoomEntry}
          onSelectFilter={onSelectFilter}
          onSelectRoom={setCurrentRoomSlug}
          rooms={rooms}
          selectedRoomSlug={selectedRoomSlug}
        />
      ) : null}
      {!isMobileLayout && !isChromeReduced ? (
        <>
          <HomeRoomStage
            rooms={rooms}
            currentRoomSlug={selectedRoomSlug}
            errorMessage={roomListErrorMessage}
            isLoading={roomsQuery.isPending}
            onSelectRoom={setCurrentRoomSlug}
            onRequestRoomEntry={roomEntry.requestRoomEntry}
            onRetry={() => {
              void roomsQuery.refetch();
            }}
          />
          <HomeSearchControlDock
            ariaLabel="홈 하단 컨트롤"
            selectedRoomSlug={selectedRoomSlug}
            canGoPrevious={Boolean(previousRoom)}
            canGoNext={Boolean(nextRoom)}
            activeFilters={activeFilters}
            genreOptions={genreOptions}
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
