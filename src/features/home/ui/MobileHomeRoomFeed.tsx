"use client";

import { useState } from "react";
import Image from "next/image";
import { Settings, Shuffle, UsersRound } from "lucide-react";
import { ClipLoader } from "react-spinners";
import type { Room } from "@/src/features/room/model/types";
import {
  getRoomImageSrc,
  ROOM_CARD_IMAGE_VARIANTS,
} from "@/src/features/room/lib/getDefaultRoomImage";
import HomeControlPanelShell, {
  type HomeFilterKey,
  type HomeFilterOption,
  type HomeFilterState,
  type HomeGenreFilterOptionDescriptor,
} from "./HomeControlPanelShell";
import styles from "./MobileHomeRoomFeed.module.css";

type Props = {
  activeFilters: HomeFilterState;
  errorMessage?: string | null;
  genreOptions: HomeGenreFilterOptionDescriptor[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading?: boolean;
  isRandomEntryPending?: boolean;
  onCreateRoom: () => void;
  onLoadMoreRooms: () => void;
  onOpenFollow: () => void;
  onOpenSettings: () => void;
  onRandomEntry: () => void;
  onRetry?: () => void;
  onRequestRoomEntry: (room: Room) => void;
  onSelectFilter: (key: HomeFilterKey, option: HomeFilterOption) => void;
  onSelectRoom: (roomSlug: string) => void;
  randomEntryErrorMessage?: string | null;
  rooms: Room[];
  selectedRoomSlug: string | null;
};

type MobileHomeRoomCardProps = {
  imageSrc: string;
  isSelected: boolean;
  onRequestRoomEntry: (room: Room) => void;
  onSelectRoom: (roomSlug: string) => void;
  room: Room;
};

function MobileHomeRoomCard({
  imageSrc,
  isSelected,
  onRequestRoomEntry,
  onSelectRoom,
  room,
}: MobileHomeRoomCardProps) {
  const tags = room.tags.slice(0, 3);

  function enterRoom() {
    onSelectRoom(room.slug);
    onRequestRoomEntry(room);
  }

  return (
    <article className={styles.card} data-selected={isSelected}>
      <button
        type="button"
        className={styles.cardButton}
        onClick={enterRoom}
        aria-label={`${room.title} 방 입장`}
      >
        <span className={styles.thumbnail}>
          <Image
            src={imageSrc}
            alt=""
            fill
            sizes="96px"
            className={styles.thumbnailImage}
          />
        </span>
        <span className={styles.cardBody}>
          <span className={styles.roomTitle}>{room.title}</span>
          <span className={styles.roomMeta}>
            {room.isPrivate ? (
              <Image
                src="/icons/lock2.svg"
                alt="비밀번호 방"
                width={13}
                height={15}
                className={styles.lockIcon}
              />
            ) : null}
            {tags.length > 0 ? (
              tags.map((tag) => (
                <span key={tag.slug} className={styles.tag}>
                  {tag.name}
                </span>
              ))
            ) : (
              <span className={styles.tag}>태그없음</span>
            )}
          </span>
        </span>
        <span className={styles.enterText}>입장</span>
      </button>
    </article>
  );
}

export default function MobileHomeRoomFeed({
  activeFilters,
  errorMessage,
  genreOptions,
  hasNextPage,
  isFetchingNextPage,
  isLoading = false,
  isRandomEntryPending = false,
  onCreateRoom,
  onLoadMoreRooms,
  onOpenFollow,
  onOpenSettings,
  onRandomEntry,
  onRetry,
  onRequestRoomEntry,
  onSelectFilter,
  onSelectRoom,
  randomEntryErrorMessage = null,
  rooms,
  selectedRoomSlug,
}: Props) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const showEmptyState = rooms.length === 0;
  const genreOptionLabelByValue = new Map(
    genreOptions.map((option) => [option.value, option.label]),
  );
  const activeFilterSummary = [
    activeFilters.genre
      .map((genre) => genreOptionLabelByValue.get(genre) ?? genre)
      .join(", "),
    activeFilters.date,
    activeFilters.participants,
  ].join(" / ");

  return (
    <main className={styles.root} aria-label="모바일 홈 방 목록">
      <section className={styles.quickActions} aria-label="홈 빠른 메뉴">
        <button
          type="button"
          className={styles.primaryAction}
          onClick={onCreateRoom}
        >
          방 만들기
        </button>
        <button
          type="button"
          className={styles.secondaryAction}
          onClick={onRandomEntry}
          disabled={isRandomEntryPending}
          aria-label="랜덤 입장"
          aria-busy={isRandomEntryPending}
        >
          {isRandomEntryPending ? (
            <ClipLoader color="#3c3c3c" size={16} aria-label="랜덤 입장 중" />
          ) : (
            <Shuffle className={styles.actionIcon} aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          className={styles.secondaryAction}
          onClick={onOpenFollow}
          aria-label="팔로우"
        >
          <UsersRound className={styles.actionIcon} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.secondaryAction}
          onClick={onOpenSettings}
          aria-label="설정"
        >
          <Settings className={styles.actionIcon} aria-hidden="true" />
        </button>
      </section>
      {randomEntryErrorMessage ? (
        <p className={styles.quickActionError} role="alert">
          {randomEntryErrorMessage}
        </p>
      ) : null}

      <section className={styles.filterSection} aria-label="홈 필터">
        <button
          type="button"
          className={styles.filterToggle}
          aria-expanded={isFilterOpen}
          onClick={() => setIsFilterOpen((currentValue) => !currentValue)}
        >
          <span>필터</span>
          <span className={styles.filterSummary}>{activeFilterSummary}</span>
        </button>
        {isFilterOpen ? (
          <HomeControlPanelShell
            variant="filter"
            activeFilters={activeFilters}
            genreOptions={genreOptions}
            onSelectFilter={onSelectFilter}
          />
        ) : null}
      </section>

      <section className={styles.listSection} aria-label="방 목록">
        {isLoading ? (
          <div className={styles.loadingState}>
            <ClipLoader color="#3c3c3c" size={28} aria-label="방 목록 로딩 중" />
          </div>
        ) : null}

        {!isLoading && errorMessage ? (
          <div className={styles.emptyState} role="alert">
            <strong>방 목록을 불러오지 못했어요.</strong>
            <span>{errorMessage}</span>
            {onRetry ? (
              <button
                type="button"
                className={styles.retryButton}
                onClick={onRetry}
              >
                다시 시도
              </button>
            ) : null}
          </div>
        ) : null}

        {!isLoading && !errorMessage && showEmptyState ? (
          <div className={styles.emptyState}>
            <strong>방이 하나도 없어요.</strong>
            <span>새 방을 만들거나 잠시 후 다시 확인해 주세요.</span>
          </div>
        ) : null}

        {!isLoading && !errorMessage && rooms.length > 0 ? (
          <div className={styles.roomList}>
            {rooms.map((room, index) => (
              <MobileHomeRoomCard
                key={room.id}
                imageSrc={getRoomImageSrc({
                  fallbackSeed: index,
                  preferredVariants: ROOM_CARD_IMAGE_VARIANTS,
                  thumbnailUrl: room.thumbnailUrl,
                  thumbnailUrls: room.thumbnailUrls,
                })}
                isSelected={room.slug === selectedRoomSlug}
                onRequestRoomEntry={onRequestRoomEntry}
                onSelectRoom={onSelectRoom}
                room={room}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !errorMessage && hasNextPage ? (
          <button
            type="button"
            className={styles.loadMoreButton}
            onClick={onLoadMoreRooms}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "불러오는 중" : "방 더 보기"}
          </button>
        ) : null}
      </section>
    </main>
  );
}
