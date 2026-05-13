"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  getRoomsFromPages,
  useRoomsQuery,
} from "@/src/entities/room/hooks/useFetchRooms";
import { useRoomMeta } from "@/src/entities/room/hooks/useRoomMeta";
import { getDefaultRoomImage } from "@/src/entities/room/lib/getDefaultRoomImage";
import { useRoomNavigator } from "@/src/shared/lib/useRoomNavigator";
import { useLoadMoreRoomsNearEnd } from "@/src/shared/lib/useLoadMoreRoomsNearEnd";
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
import FollowModal from "@/src/features/follow/ui/FollowModal";
import SettingsModal from "@/src/features/settings/ui/SettingsModal";
import { useMe } from "@/src/entities/user/hooks/useMe";
import { redirectToGoogleLogin } from "@/src/features/auth/login-with-google/api/login";
import AuthRequiredModal from "@/src/shared/ui/auth-required/AuthRequiredModal";

export default function SearchPage() {
  const [roomListFilters, setRoomListFilters] = useState(DEFAULT_HOME_FILTERS);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isAuthRequiredModalOpen, setIsAuthRequiredModalOpen] = useState(false);
  const [authRequiredDescription, setAuthRequiredDescription] = useState(
    "방 만들기는 로그인 후 이용할 수 있어요.",
  );
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const { data: me, refetch: refetchMe } = useMe();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useRoomsQuery();
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
  const { data: selectedRoomMeta } = useRoomMeta(selectedRoom?.slug ?? null);
  const selectedOwner = selectedRoomMeta?.owner ?? null;
  const selectedOwnerName = selectedOwner?.nickname?.trim() ?? "";
  const selectedOwnerImageSrc =
    selectedOwner?.profileImageUrl || "/Basic_Profile.png";
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

  const requestAuthenticatedAction = async (
    onAuthenticated: () => void,
    description: string,
  ) => {
    if (me) {
      onAuthenticated();
      return;
    }

    const result = await refetchMe();

    if (result.data) {
      onAuthenticated();
      return;
    }

    setAuthRequiredDescription(description);
    setIsAuthRequiredModalOpen(true);
  };

  const requestCreateRoom = () =>
    requestAuthenticatedAction(
      () => setIsCreateRoomModalOpen(true),
      "방 만들기는 로그인 후 이용할 수 있어요.",
    );

  const requestOpenFollow = () =>
    requestAuthenticatedAction(
      () => setIsFollowModalOpen(true),
      "친구 기능은 로그인 후 이용할 수 있어요.",
    );

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <MainLogo />
      </div>

      <div className={styles.list_container}>
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

        <div className={styles.contentGrid}>
          <div className={styles.listContent}>
            <div className={styles.room_list}>
              {isLoading ? (
                <div className={styles.statePanel}>
                  <ClipLoader color="#3c3c3c" size={36} aria-label="로딩 중" />
                </div>
              ) : isError && roomListRooms.length === 0 ? (
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
            {selectedOwnerName ? (
              <div className={styles.thumbnailOwnerBar}>
                <span className={styles.thumbnailOwnerAvatarWrap}>
                  <Image
                    src={selectedOwnerImageSrc}
                    alt=""
                    fill
                    sizes="44px"
                    unoptimized={Boolean(selectedOwner?.profileImageUrl)}
                    className={styles.thumbnailOwnerAvatar}
                  />
                </span>
                <span className={styles.thumbnailOwnerName}>
                  {selectedOwnerName}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {!isLoading && (!isError || roomListRooms.length > 0) ? (
        <HomeSearchControlDock
          ariaLabel="검색 페이지 방 이동 컨트롤"
          selectedRoomSlug={selectedRoomSlug}
          canGoPrevious={Boolean(previousRoom)}
          canGoNext={Boolean(nextRoom)}
          activeFilters={roomListFilters}
          onGoPrevious={goPrevious}
          onGoNext={goNext}
          onSelectFilter={selectRoomListFilter}
          onCreateRoom={requestCreateRoom}
          onOpenFollow={requestOpenFollow}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
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
        onClose={() => setIsAuthRequiredModalOpen(false)}
        onLogin={redirectToGoogleLogin}
      />
    </div>
  );
}
