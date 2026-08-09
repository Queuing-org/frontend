"use client";

import { useEffect, useState } from "react";
import type { Room, RoomMeta } from "@/src/features/room/model/types";
import RoomInfo, {
  type RoomInfoDisplay,
} from "@/src/features/room/info/ui/RoomInfo";
import SignUpButton from "@/src/features/auth/login-with-google/ui/SignUpButton";
import RoomSearchButton from "@/src/features/room/search/ui/RoomSearchButton";
import { Search, X } from "lucide-react";
import { useDebouncedValue } from "@/src/shared/lib/useDebouncedValue";
import MainLogo from "@/src/shared/ui/main-logo/MainLogo";
import styles from "./HomeTopBar.module.css";

const MOBILE_SEARCH_DEBOUNCE_MS = 300;

type Props = {
  currentRoom: Room | null;
  isChromeReduced?: boolean;
  onMobileSearchQueryChange?: (query: string) => void;
  roomMeta?: RoomMeta | null;
};

export default function HomeTopBar({
  currentRoom,
  isChromeReduced = false,
  onMobileSearchQueryChange,
  roomMeta,
}: Props) {
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const debouncedMobileSearchQuery = useDebouncedValue(
    mobileSearchQuery,
    MOBILE_SEARCH_DEBOUNCE_MS,
  );
  const currentRoomMeta =
    roomMeta && currentRoom && roomMeta.slug === currentRoom.slug
      ? roomMeta
      : null;

  useEffect(() => {
    onMobileSearchQueryChange?.(debouncedMobileSearchQuery);
  }, [debouncedMobileSearchQuery, onMobileSearchQueryChange]);
  const roomInfo: RoomInfoDisplay | null = !isChromeReduced && currentRoom
    ? {
        activeUsersCount: currentRoomMeta?.activeUsersCount ?? null,
        hasPassword: currentRoomMeta?.hasPassword ?? currentRoom.isPrivate,
        tags: currentRoomMeta?.tags ?? currentRoom.tags,
        title: currentRoomMeta?.title ?? currentRoom.title,
      }
    : null;

  return (
    <div className={styles.topBar}>
      <div className={styles.leftGroup}>
        <MainLogo />
        <div className={styles.desktopSearchButton}>
          <RoomSearchButton />
        </div>
        <form
          className={styles.mobileSearchForm}
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className={styles.mobileSearchField}>
            <input
              type="search"
              className={styles.mobileSearchInput}
              value={mobileSearchQuery}
              placeholder="방이름을 검색하세요"
              aria-label="방 검색"
              autoComplete="off"
              onChange={(event) => setMobileSearchQuery(event.target.value)}
            />
            {mobileSearchQuery ? (
              <button
                type="button"
                className={styles.mobileSearchReset}
                aria-label="검색어 지우기"
                onClick={() => setMobileSearchQuery("")}
              >
                <X
                  className={styles.mobileSearchResetIcon}
                  aria-hidden="true"
                />
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.mobileSearchButton}
            aria-label="검색"
          >
            <Search className={styles.mobileSearchIcon} aria-hidden="true" />
          </button>
        </form>
      </div>
      {!isChromeReduced ? (
        <div className={styles.centerGroup}>
          <RoomInfo roomInfo={roomInfo} />
        </div>
      ) : null}
      {!isChromeReduced ? (
        <div className={styles.rightGroup}>
          <SignUpButton />
        </div>
      ) : null}
    </div>
  );
}
