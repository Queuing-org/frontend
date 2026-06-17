"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  getRoomsFromPages,
  useRoomsQuery,
} from "@/src/features/room/hooks/useFetchRooms";
import { getDefaultRoomImage } from "@/src/features/room/lib/getDefaultRoomImage";
import { useRoomNavigator } from "@/src/shared/lib/useRoomNavigator";
import { useLoadMoreRoomsNearEnd } from "@/src/shared/lib/useLoadMoreRoomsNearEnd";
import { useAuthenticatedAction } from "@/src/shared/lib/useAuthenticatedAction";
import QueryBoundary from "@/src/shared/ui/query-boundary/QueryBoundary";
import { SearchPageRoomList } from "@/src/features/room/search/ui/SearchPageRoomList";
import MainLogo from "@/src/features/home/ui/MainLogo";
import styles from "./SearchScreen.module.css";
import Image from "next/image";
import RoomSearchInput from "@/src/features/room/search/ui/RoomSearchInput";
import {
  DEFAULT_HOME_FILTERS,
  getNextHomeFilters,
  type HomeFilterKey,
  type HomeFilterOption,
} from "@/src/features/home/ui/HomeControlPanelShell";
import HomeSearchControlDock from "@/src/features/home/ui/HomeSearchControlDock";
import RoomFormModal from "@/src/features/room/create/ui/RoomFormModal";
import { useRoomEntry } from "@/src/features/room/join/model/useRoomEntry";
import RoomJoinPasswordModal from "@/src/features/room/join/ui/RoomJoinPasswordModal";
import FollowModal from "@/src/features/follow/ui/FollowModal";
import SettingsModal from "@/src/features/settings/ui/SettingsModal";
import { redirectToGoogleLogin } from "@/src/features/auth/login-with-google/api/login";
import AuthRequiredModal from "@/src/shared/ui/auth-required/AuthRequiredModal";

export default function SearchScreen() {
  const [roomListFilters, setRoomListFilters] = useState(DEFAULT_HOME_FILTERS);
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
    <div className={styles.container}>
      <div className={styles.logo}>
        <MainLogo />
      </div>

      <QueryBoundary
        fallback={<SearchRoomsFallback />}
        errorFallback={({ resetErrorBoundary }) => (
          <SearchRoomsErrorFallback onRetry={resetErrorBoundary} />
        )}
        errorTitle="방 목록을 불러오지 못했어요."
        errorDescription="새로고침을 시도해주세요."
      >
        <SearchRoomsContent
          activeFilters={roomListFilters}
          onCreateRoom={requestCreateRoom}
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

function SearchPanelHeader() {
  return (
    <div className={styles.searchHeader}>
      <Link
        href="/home"
        className={styles.backButton}
        aria-label="홈으로 돌아가기"
      >
        <Image
          src="/icons/room_left_arrow.svg"
          alt=""
          width={10}
          height={17}
          className={`${styles.backIcon} ${styles.backIconDefault}`}
          aria-hidden="true"
        />
        <Image
          src="/icons/hover_left_arrow.svg"
          alt=""
          width={10}
          height={17}
          className={`${styles.backIcon} ${styles.backIconHover}`}
          aria-hidden="true"
        />
      </Link>
      <div className={styles.search_input}>
        <RoomSearchInput />
      </div>
    </div>
  );
}

function SearchRoomsFallback() {
  return (
    <div className={styles.list_container}>
      <SearchPanelHeader />
      <div className={styles.contentGrid}>
        <div className={styles.listContent}>
          <div className={styles.room_list}>
            <div className={styles.statePanel}>방 목록 로딩 중...</div>
          </div>
        </div>
        <div className={styles.thumbnail_container} aria-hidden="true" />
      </div>
    </div>
  );
}

type SearchRoomsErrorFallbackProps = {
  onRetry: () => void;
};

function SearchRoomsErrorFallback({ onRetry }: SearchRoomsErrorFallbackProps) {
  return (
    <div className={styles.list_container}>
      <SearchPanelHeader />
      <div className={styles.contentGrid}>
        <div className={styles.listContent}>
          <div className={styles.room_list}>
            <div className={styles.statePanel} role="alert">
              <span>방 목록을 불러오지 못했어요.</span>
              <button
                type="button"
                className={styles.stateButton}
                onClick={onRetry}
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
        <div className={styles.thumbnail_container} aria-hidden="true" />
      </div>
    </div>
  );
}

type SearchRoomsContentProps = {
  activeFilters: typeof DEFAULT_HOME_FILTERS;
  onCreateRoom: () => void;
  onOpenFollow: () => void;
  onOpenSettings: () => void;
  onSelectFilter: (key: HomeFilterKey, option: HomeFilterOption) => void;
};

function SearchRoomsContent({
  activeFilters,
  onCreateRoom,
  onOpenFollow,
  onOpenSettings,
  onSelectFilter,
}: SearchRoomsContentProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useRoomsQuery();
  const rooms = useMemo(() => getRoomsFromPages(data), [data]);
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

  useLoadMoreRoomsNearEnd({
    rooms: roomListRooms,
    selectedRoomSlug,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage,
  });

  const selectedRoomIndex = selectedRoomSlug
    ? roomListRooms.findIndex((room) => room.slug === selectedRoomSlug)
    : -1;
  const selectedRoom =
    selectedRoomIndex >= 0 ? roomListRooms[selectedRoomIndex] : null;
  const backgroundImageSrc = getDefaultRoomImage(
    selectedRoomIndex >= 0 ? selectedRoomIndex : 0,
  );

  return (
    <>
      <div className={styles.list_container}>
        <SearchPanelHeader />
        <div className={styles.contentGrid}>
          <div className={styles.listContent}>
            <div className={styles.room_list}>
              <SearchPageRoomList
                rooms={roomListRooms}
                selectedRoomSlug={selectedRoomSlug}
                onSelectRoom={setCurrentRoomSlug}
                onRequestRoomEntry={roomEntry.requestRoomEntry}
              />
            </div>
          </div>

          <div className={styles.thumbnail_container}>
            <div className={styles.thumbnailImageFrame}>
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
        </div>
      </div>

      <HomeSearchControlDock
        ariaLabel="검색 페이지 방 이동 컨트롤"
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
          if (selectedRoom) {
            roomEntry.requestRoomEntry(selectedRoom);
          }
        }}
      />

      <RoomJoinPasswordModal
        room={roomEntry.passwordRoom}
        onClose={roomEntry.closePasswordModal}
        onJoined={roomEntry.completePasswordEntry}
      />
    </>
  );
}
