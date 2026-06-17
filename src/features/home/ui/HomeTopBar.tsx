import type { Room } from "@/src/features/room/model/types";
import RoomInfo from "@/src/features/room/info/ui/RoomInfo";
import SignUpButton from "@/src/features/auth/login-with-google/ui/SignUpButton";
import RoomSearchButton from "@/src/features/room/search/ui/RoomSearchButton";
import { Search, X } from "lucide-react";
import MainLogo from "./MainLogo";
import styles from "./HomeTopBar.module.css";

type Props = {
  currentRoom: Room | null;
  mobileSearchQuery?: string;
  onMobileSearchQueryChange?: (query: string) => void;
};

export default function HomeTopBar({
  currentRoom,
  mobileSearchQuery = "",
  onMobileSearchQueryChange,
}: Props) {
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
              onChange={(event) =>
                onMobileSearchQueryChange?.(event.target.value)
              }
            />
            {mobileSearchQuery ? (
              <button
                type="button"
                className={styles.mobileSearchReset}
                aria-label="검색어 지우기"
                onClick={() => onMobileSearchQueryChange?.("")}
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
      <div className={styles.centerGroup}>
        <RoomInfo slug={currentRoom?.slug ?? null} />
      </div>
      <div className={styles.rightGroup}>
        <SignUpButton />
      </div>
    </div>
  );
}
