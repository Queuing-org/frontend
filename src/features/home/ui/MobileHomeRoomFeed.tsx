"use client";

import { useState } from "react";
import Image from "next/image";
import { Settings, UsersRound } from "lucide-react";
import type { Room } from "@/src/features/room/model/types";
import { getDefaultRoomImage } from "@/src/features/room/lib/getDefaultRoomImage";
import HomeControlPanelShell, {
  type HomeFilterKey,
  type HomeFilterOption,
  type HomeFilterState,
} from "./HomeControlPanelShell";
import styles from "./MobileHomeRoomFeed.module.css";

type Props = {
  activeFilters: HomeFilterState;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  onCreateRoom: () => void;
  onLoadMoreRooms: () => void;
  onOpenFollow: () => void;
  onOpenSettings: () => void;
  onRequestRoomEntry: (room: Room) => void;
  onSelectFilter: (key: HomeFilterKey, option: HomeFilterOption) => void;
  onSelectRoom: (roomSlug: string) => void;
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

const skeletonItems = [0, 1, 2] as const;

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
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  onCreateRoom,
  onLoadMoreRooms,
  onOpenFollow,
  onOpenSettings,
  onRequestRoomEntry,
  onSelectFilter,
  onSelectRoom,
  rooms,
  selectedRoomSlug,
}: Props) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const showEmptyState = !isLoading && rooms.length === 0;
  const activeFilterSummary = [
    activeFilters.genre.join(", "),
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
            onSelectFilter={onSelectFilter}
          />
        ) : null}
      </section>

      <section className={styles.listSection} aria-label="방 목록">
        {isLoading ? (
          <div className={styles.skeletonList} aria-label="방 목록 로딩 중">
            {skeletonItems.map((item) => (
              <div key={item} className={styles.skeletonCard} />
            ))}
          </div>
        ) : null}

        {showEmptyState ? (
          <div className={styles.emptyState}>
            <strong>방이 하나도 없어요.</strong>
            <span>새 방을 만들거나 잠시 후 다시 확인해 주세요.</span>
          </div>
        ) : null}

        {!isLoading && rooms.length > 0 ? (
          <div className={styles.roomList}>
            {rooms.map((room, index) => (
              <MobileHomeRoomCard
                key={room.id}
                imageSrc={getDefaultRoomImage(index)}
                isSelected={room.slug === selectedRoomSlug}
                onRequestRoomEntry={onRequestRoomEntry}
                onSelectRoom={onSelectRoom}
                room={room}
              />
            ))}
          </div>
        ) : null}

        {hasNextPage ? (
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
