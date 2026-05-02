"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRoomsQuery } from "@/src/entities/room/hooks/useFetchRooms";
import { useRoomNavigator } from "@/src/shared/lib/useRoomNavigator";
import RadialControl from "@/src/shared/ui/radial-control/RadialControl";
import HomeControlPanelShell, {
  DEFAULT_HOME_FILTERS,
  HOME_CONTROL_PANEL_IDS,
  getNextHomeFilters,
  type HomeFilterKey,
  type HomeFilterOption,
  type HomeMenuItem,
} from "./HomeControlPanelShell";
import HomeTopBar from "./HomeTopBar";
import HomeRoomStage from "@/src/features/room/list/ui/HomeRoomStage";
import styles from "./HomeScreen.module.css";

type HomePanelKey = "menu" | "filter";

export default function HomeScreen() {
  const [openPanel, setOpenPanel] = useState<HomePanelKey | null>(null);
  const [activeMenuItem, setActiveMenuItem] = useState<HomeMenuItem>("QUE");
  const [roomListFilters, setRoomListFilters] =
    useState(DEFAULT_HOME_FILTERS);
  const { data, isLoading, isError, error } = useRoomsQuery();
  const rooms = data?.rooms ?? [];
  const {
    currentRoom,
    selectedRoomSlug,
    setCurrentRoomSlug,
    previousRoom,
    nextRoom,
    goPrevious,
    goNext,
  } = useRoomNavigator(rooms);

  const togglePanel = (panel: HomePanelKey) => {
    setOpenPanel((currentPanel) => (currentPanel === panel ? null : panel));
  };

  const selectRoomListFilter = (
    key: HomeFilterKey,
    option: HomeFilterOption,
  ) => {
    setRoomListFilters((currentFilters) =>
      getNextHomeFilters(currentFilters, key, option),
    );
  };

  if (isLoading) return <div>방 목록 로딩중...</div>;
  if (isError)
    return (
      <div>
        방 목록 가져오기에 실패했어요: ({error.status}) {error.message}
      </div>
    );

  return (
    <div className={styles.screen}>
      <HomeTopBar currentRoom={currentRoom} />
      <HomeRoomStage
        rooms={rooms}
        currentRoomSlug={selectedRoomSlug}
        onSelectRoom={setCurrentRoomSlug}
      />
      {currentRoom ? (
        <div className={styles.controlWrap}>
          {openPanel ? (
            <div className={styles.panelAnchor}>
              {openPanel === "menu" ? (
                <HomeControlPanelShell
                  variant="menu"
                  activeMenuItem={activeMenuItem}
                  onSelectMenuItem={setActiveMenuItem}
                />
              ) : (
                <HomeControlPanelShell
                  variant="filter"
                  activeFilters={roomListFilters}
                  onSelectFilter={selectRoomListFilter}
                />
              )}
            </div>
          ) : null}
          <RadialControl
            ariaLabel="홈 하단 컨트롤"
            top={
              <button
                type="button"
                className={styles.controlToggle}
                onClick={() => togglePanel("menu")}
                aria-label={
                  openPanel === "menu" ? "메뉴 패널 닫기" : "메뉴 패널 열기"
                }
                aria-controls={HOME_CONTROL_PANEL_IDS.menu}
                aria-expanded={openPanel === "menu"}
                data-active={openPanel === "menu"}
              >
                {openPanel === "menu" ? (
                  <Image
                    className={styles.toggleIcon}
                    src="/icons/exit.svg"
                    alt=""
                    width={20}
                    height={17}
                  />
                ) : (
                  "MENU"
                )}
              </button>
            }
            left={
              <button
                type="button"
                onClick={goPrevious}
                disabled={!previousRoom}
                aria-label="이전 방 보기"
              >
                <Image
                  src="/icons/left_arrow.svg"
                  alt=""
                  width={20}
                  height={20}
                />
              </button>
            }
            center={
              <Link
                href={`/room/${encodeURIComponent(selectedRoomSlug ?? "")}`}
                aria-label="방입장"
              />
            }
            right={
              <button
                type="button"
                onClick={goNext}
                disabled={!nextRoom}
                aria-label="다음 방 보기"
              >
                <Image
                  src="/icons/right_arrow.svg"
                  alt=""
                  width={20}
                  height={20}
                />
              </button>
            }
            bottom={
              <button
                type="button"
                className={styles.controlToggle}
                onClick={() => togglePanel("filter")}
                aria-label={
                  openPanel === "filter" ? "필터 패널 닫기" : "필터 패널 열기"
                }
                aria-controls={HOME_CONTROL_PANEL_IDS.filter}
                aria-expanded={openPanel === "filter"}
                data-active={openPanel === "filter"}
              >
                {openPanel === "filter" ? (
                  <Image
                    className={styles.toggleIcon}
                    src="/icons/exit.svg"
                    alt=""
                    width={20}
                    height={17}
                  />
                ) : (
                  "FILTER"
                )}
              </button>
            }
          />
        </div>
      ) : null}
    </div>
  );
}
