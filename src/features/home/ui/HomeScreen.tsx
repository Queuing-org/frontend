"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  getRoomsFromPages,
  normalizeRoomsQueryParams,
  type RoomsQueryParams,
  useRoomsQuery,
} from "@/src/features/room/hooks/useFetchRooms";
import { useRoomMetaQuery } from "@/src/features/room/hooks/useRoomMeta";
import { useRoomTagsQuery } from "@/src/features/room/hooks/useRoomTags";
import { useRandomEntryNavigation } from "@/src/features/room/hooks/useRandomEntryNavigation";
import { useMediaQuery } from "@/src/shared/lib/useMediaQuery";
import { useRoomNavigator } from "@/src/features/room/hooks/useRoomNavigator";
import { useLoadMoreRoomsNearEnd } from "@/src/features/room/hooks/useLoadMoreRoomsNearEnd";
import { useAuthenticatedAction } from "@/src/features/auth/hooks/useAuthenticatedAction";
import {
  DEFAULT_HOME_FILTERS,
  getHomeGenreFilterOptions,
  getNextHomeFilters,
  getSelectedHomeGenreTags,
  type HomeFilterKey,
  type HomeFilterOption,
  type HomeMenuItem,
} from "@/src/features/room/discovery/ui/HomeControlPanelShell";
import HomeTopBar from "./HomeTopBar";
import HomeSearchControlDock from "@/src/features/room/discovery/ui/HomeSearchControlDock";
import MobileHomeRoomFeed from "./MobileHomeRoomFeed";
import HomeRoomStage from "@/src/features/room/list/ui/HomeRoomStage";
import { redirectToGoogleLogin } from "@/src/features/auth/login-with-google/api/login";
import { useRoomEntry } from "@/src/features/room/join/model/useRoomEntry";
import AuthRequiredModal from "@/src/shared/ui/auth-required/AuthRequiredModal";
import { mergeRoomMeta } from "@/src/features/room/model/mergeRoomMeta";
import styles from "./HomeScreen.module.css";
import LazyModalFallback from "@/src/shared/ui/lazy-modal-fallback/LazyModalFallback";
import { useIdlePreload } from "@/src/shared/lib/useIdlePreload";
import {
  DISCOVERY_MODAL_PRELOADERS,
  discoveryModalResources,
  preloadDiscoveryModalForMenuItem,
} from "@/src/features/room/discovery/lib/discoveryModalResources";
import { useDiscoveryModalController } from "@/src/features/room/discovery/model/useDiscoveryModalController";

const RoomJoinPasswordModal = dynamic(
  () => import("@/src/features/room/join/ui/RoomJoinPasswordModal"),
  {
    ssr: false,
    loading: () => <LazyModalFallback label="방 입장 화면 로딩 중" />,
  },
);
const RoomFormModal = discoveryModalResources.create.Component;
const FollowModal = discoveryModalResources.follow.Component;
const SettingsModal = discoveryModalResources.settings.Component;

export default function HomeScreen() {
  useIdlePreload(DISCOVERY_MODAL_PRELOADERS);

  const isMobileLayout = useMediaQuery("(max-width: 760px)");
  const [roomListFilters, setRoomListFilters] =
    useState(DEFAULT_HOME_FILTERS);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const discoveryModal = useDiscoveryModalController();
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
        keyword: isMobileLayout ? mobileSearchQuery : undefined,
        participantOrder: roomListFilters.participants,
        tags: getSelectedHomeGenreTags(roomListFilters.genre),
      }),
    [
      isMobileLayout,
      mobileSearchQuery,
      roomListFilters.date,
      roomListFilters.genre,
      roomListFilters.participants,
    ],
  );

  const requestCreateRoom = () => {
    requestAuthenticatedAction({
      description: "방 만들기는 로그인 후 이용할 수 있어요.",
      onAuthenticated: () => discoveryModal.requestModal("create"),
    });
  };

  const requestOpenFollow = () => {
    requestAuthenticatedAction({
      description: "팔로우 기능은 로그인 후 이용할 수 있어요.",
      onAuthenticated: () => discoveryModal.requestModal("follow"),
    });
  };

  const requestOpenSettings = () => {
    requestAuthenticatedAction({
      description: "설정은 로그인 후 이용할 수 있어요.",
      onAuthenticated: () => discoveryModal.requestModal("settings"),
    });
  };
  const hasPageModalOpen =
    Boolean(discoveryModal.activeModal) ||
    isAuthRequiredModalOpen;

  return (
    <div className={styles.screen}>
      <HomeRoomsContent
        activeFilters={roomListFilters}
        hasPageModalOpen={hasPageModalOpen}
        isMobileLayout={isMobileLayout}
        modalLoadErrorMessage={discoveryModal.loadErrorMessage}
        onCreateRoom={requestCreateRoom}
        onMobileSearchQueryChange={setMobileSearchQuery}
        onMenuItemIntent={preloadDiscoveryModalForMenuItem}
        onOpenFollow={requestOpenFollow}
        onOpenSettings={requestOpenSettings}
        onSelectFilter={selectRoomListFilter}
        roomsQueryParams={roomListQueryParams}
      />
      {discoveryModal.activeModal === "create" ? (
        <RoomFormModal
          open
          mode="create"
          onClose={discoveryModal.closeModal}
        />
      ) : null}
      {discoveryModal.activeModal === "follow" ? (
        <FollowModal open onClose={discoveryModal.closeModal} />
      ) : null}
      {discoveryModal.activeModal === "settings" ? (
        <SettingsModal open onClose={discoveryModal.closeModal} />
      ) : null}
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
  modalLoadErrorMessage: string | null;
  onCreateRoom: () => void;
  onMobileSearchQueryChange: (query: string) => void;
  onMenuItemIntent: (menuItem: HomeMenuItem) => void;
  onOpenFollow: () => void;
  onOpenSettings: () => void;
  onSelectFilter: (key: HomeFilterKey, option: HomeFilterOption) => void;
  roomsQueryParams: RoomsQueryParams;
};

function HomeRoomsContent({
  activeFilters,
  hasPageModalOpen,
  isMobileLayout,
  modalLoadErrorMessage,
  onCreateRoom,
  onMobileSearchQueryChange,
  onMenuItemIntent,
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
        selectedGenres: activeFilters.genre,
        tags: roomTagsQuery.data,
      }),
    [
      activeFilters.genre,
      roomTagsQuery.data,
      roomTagsQuery.isError,
      roomTagsQuery.isLoading,
    ],
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
  const randomEntry = useRandomEntryNavigation();
  const actionErrorMessage =
    modalLoadErrorMessage ?? randomEntry.errorMessage;
  const isChromeReduced = hasPageModalOpen || Boolean(roomEntry.passwordRoom);
  const roomMetaQuery = useRoomMetaQuery(
    !isChromeReduced ? selectedRoomSlug : null,
  );
  const visibleRooms = useMemo(
    () =>
      rooms.map((room) =>
        room.slug === selectedRoomSlug
          ? mergeRoomMeta(room, roomMetaQuery.data)
          : room,
      ),
    [roomMetaQuery.data, rooms, selectedRoomSlug],
  );
  const visibleCurrentRoom = currentRoom
    ? mergeRoomMeta(currentRoom, roomMetaQuery.data)
    : null;

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
        currentRoom={visibleCurrentRoom}
        isChromeReduced={isChromeReduced}
        onMobileSearchQueryChange={onMobileSearchQueryChange}
        roomMeta={roomMetaQuery.data ?? null}
      />
      {isMobileLayout && !isChromeReduced ? (
        <MobileHomeRoomFeed
          activeFilters={activeFilters}
          actionErrorMessage={actionErrorMessage}
          errorMessage={roomListErrorMessage}
          genreOptions={genreOptions}
          hasNextPage={Boolean(roomsQuery.hasNextPage)}
          isFetchingNextPage={roomsQuery.isFetchingNextPage}
          isLoading={roomsQuery.isPending}
          isRandomEntryPending={randomEntry.isPending}
          onCreateRoom={onCreateRoom}
          onLoadMoreRooms={() => {
            void roomsQuery.fetchNextPage();
          }}
          onMenuItemIntent={onMenuItemIntent}
          onOpenFollow={onOpenFollow}
          onOpenSettings={onOpenSettings}
          onRandomEntry={randomEntry.requestRandomEntry}
          onRetry={() => {
            void roomsQuery.refetch();
          }}
          onRequestRoomEntry={roomEntry.requestRoomEntry}
          onSelectFilter={onSelectFilter}
          onSelectRoom={setCurrentRoomSlug}
          rooms={visibleRooms}
          selectedRoomSlug={selectedRoomSlug}
        />
      ) : null}
      {!isMobileLayout && !isChromeReduced ? (
        <>
          <HomeRoomStage
            rooms={visibleRooms}
            currentRoomSlug={selectedRoomSlug}
            errorMessage={roomListErrorMessage}
            isLoading={roomsQuery.isPending}
            selectedRoomOwner={roomMetaQuery.data?.owner ?? null}
            onCreateRoom={onCreateRoom}
            onCreateRoomIntent={() => onMenuItemIntent("CREATE")}
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
            onRandomEntry={randomEntry.requestRandomEntry}
            onSelectFilter={onSelectFilter}
            onCreateRoom={onCreateRoom}
            onOpenFollow={onOpenFollow}
            onOpenSettings={onOpenSettings}
            onMenuItemIntent={onMenuItemIntent}
            isRandomEntryPending={randomEntry.isPending}
            actionErrorMessage={actionErrorMessage}
            onEnterSelectedRoom={() => {
              if (visibleCurrentRoom) {
                roomEntry.requestRoomEntry(visibleCurrentRoom);
              }
            }}
          />
        </>
      ) : null}
      {roomEntry.passwordRoom ? (
        <RoomJoinPasswordModal
          room={roomEntry.passwordRoom}
          onClose={roomEntry.closePasswordModal}
          onJoined={roomEntry.completePasswordEntry}
        />
      ) : null}
    </>
  );
}
