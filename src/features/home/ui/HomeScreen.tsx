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
} from "@/src/features/room/discovery/ui/HomeControlPanelShell";
import HomeTopBar from "./HomeTopBar";
import HomeSearchControlDock from "@/src/features/room/discovery/ui/HomeSearchControlDock";
import MobileHomeRoomFeed from "./MobileHomeRoomFeed";
import HomeRoomStage from "@/src/features/room/list/ui/HomeRoomStage";
import RoomFormModal from "@/src/features/room/create/ui/RoomFormModal";
import FollowModal from "@/src/features/follow/ui/FollowModal";
import SettingsModal from "@/src/features/settings/ui/SettingsModal";
import { redirectToGoogleLogin } from "@/src/features/auth/login-with-google/api/login";
import { useRoomEntry } from "@/src/features/room/join/model/useRoomEntry";
import AuthRequiredModal from "@/src/shared/ui/auth-required/AuthRequiredModal";
import { mergeRoomMeta } from "@/src/features/room/model/mergeRoomMeta";
import styles from "./HomeScreen.module.css";
import LazyModalFallback from "@/src/shared/ui/lazy-modal-fallback/LazyModalFallback";
import RoomDeletedNoticeBanner from "./RoomDeletedNoticeBanner";
import { MOBILE_VIEWPORT_MEDIA_QUERY } from "@/src/shared/lib/viewportDensity";

const RoomJoinPasswordModal = dynamic(
  () => import("@/src/features/room/join/ui/RoomJoinPasswordModal"),
  {
    ssr: false,
    loading: () => <LazyModalFallback label="방 입장 화면 로딩 중" />,
  },
);
type DiscoveryModalKey = "create" | "follow" | "settings";

export default function HomeScreen() {
  const isMobileLayout = useMediaQuery(MOBILE_VIEWPORT_MEDIA_QUERY);
  const [roomListFilters, setRoomListFilters] =
    useState(DEFAULT_HOME_FILTERS);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [activeModal, setActiveModal] =
    useState<DiscoveryModalKey | null>(null);
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
      onAuthenticated: () => setActiveModal("create"),
    });
  };

  const requestOpenFollow = () => {
    requestAuthenticatedAction({
      description: "팔로우 기능은 로그인 후 이용할 수 있어요.",
      onAuthenticated: () => setActiveModal("follow"),
    });
  };

  const requestOpenSettings = () => {
    requestAuthenticatedAction({
      description: "설정은 로그인 후 이용할 수 있어요.",
      onAuthenticated: () => setActiveModal("settings"),
    });
  };
  const hasPageModalOpen = Boolean(activeModal) || isAuthRequiredModalOpen;
  const closeDiscoveryModal = () => setActiveModal(null);

  return (
    <div className={styles.screen}>
      <RoomDeletedNoticeBanner />
      <HomeRoomsContent
        activeFilters={roomListFilters}
        hasPageModalOpen={hasPageModalOpen}
        isDiscoveryModalOpen={Boolean(activeModal)}
        isMobileLayout={isMobileLayout}
        onCreateRoom={requestCreateRoom}
        onMobileSearchQueryChange={setMobileSearchQuery}
        onOpenFollow={requestOpenFollow}
        onOpenSettings={requestOpenSettings}
        onSelectFilter={selectRoomListFilter}
        roomsQueryParams={roomListQueryParams}
      />
      {activeModal === "create" ? (
        <RoomFormModal open mode="create" onClose={closeDiscoveryModal} />
      ) : null}
      {activeModal === "follow" ? (
        <FollowModal open onClose={closeDiscoveryModal} />
      ) : null}
      {activeModal === "settings" ? (
        <SettingsModal open onClose={closeDiscoveryModal} />
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
  isDiscoveryModalOpen: boolean;
  isMobileLayout: boolean;
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
  isDiscoveryModalOpen,
  isMobileLayout,
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
  const actionErrorMessage = randomEntry.errorMessage;
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
            onSelectRoom={setCurrentRoomSlug}
            onRequestRoomEntry={roomEntry.requestRoomEntry}
            onRetry={() => {
              void roomsQuery.refetch();
            }}
          />
        </>
      ) : null}
      {!isMobileLayout && (!isChromeReduced || isDiscoveryModalOpen) ? (
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
          isRandomEntryPending={randomEntry.isPending}
          actionErrorMessage={actionErrorMessage}
          isNavigationLocked={isDiscoveryModalOpen}
          onEnterSelectedRoom={() => {
            if (visibleCurrentRoom) {
              roomEntry.requestRoomEntry(visibleCurrentRoom);
            }
          }}
        />
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
