"use client";

import { useState } from "react";
import { useRoomsQuery } from "@/src/entities/room/hooks/useFetchRooms";
import { getDefaultRoomImage } from "@/src/entities/room/lib/getDefaultRoomImage";
import { useRoomNavigator } from "@/src/shared/lib/useRoomNavigator";
import { SearchPageRoomList } from "@/src/features/room/search/ui/SearchPageRoomList";
import MainLogo from "@/src/widgets/home/ui/MainLogo";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import RadialControl from "@/src/shared/ui/radial-control/RadialControl";
import RoomSearchBadge from "@/src/features/room/search/ui/RoomSearchBadge";
import RoomSearchInput from "@/src/features/room/search/ui/RoomSearchInput";
import { ClipLoader } from "react-spinners";
import HomeControlPanelShell, {
  DEFAULT_HOME_FILTERS,
  HOME_CONTROL_PANEL_IDS,
  getNextHomeFilters,
  type HomeFilterKey,
  type HomeFilterOption,
  type HomeMenuItem,
} from "@/src/widgets/home/ui/HomeControlPanelShell";
import RoomFormModal from "@/src/features/room/create/ui/RoomFormModal";

type SearchPanelKey = "menu" | "filter";

export default function SearchPage() {
  const [openPanel, setOpenPanel] = useState<SearchPanelKey | null>(null);
  const [activeMenuItem, setActiveMenuItem] = useState<HomeMenuItem>("QUE");
  const [roomListFilters, setRoomListFilters] =
    useState(DEFAULT_HOME_FILTERS);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const { data, isLoading, isError } = useRoomsQuery();
  const rooms = data?.rooms ?? [];
  const roomListRooms = rooms;
  const { selectedRoomSlug, previousRoom, nextRoom, goPrevious, goNext } =
    useRoomNavigator(roomListRooms);
  const selectedRoomIndex = selectedRoomSlug
    ? roomListRooms.findIndex((room) => room.slug === selectedRoomSlug)
    : -1;
  const selectedRoom =
    selectedRoomIndex >= 0 ? roomListRooms[selectedRoomIndex] : null;
  const backgroundImageSrc = getDefaultRoomImage(
    selectedRoomIndex >= 0 ? selectedRoomIndex : 0,
  );

  const togglePanel = (panel: SearchPanelKey) => {
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

  const selectMenuItem = (menuItem: HomeMenuItem) => {
    setActiveMenuItem(menuItem);

    if (menuItem === "CREATE") {
      setOpenPanel(null);
      setIsCreateRoomModalOpen(true);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <MainLogo />
      </div>

      <div className={styles.list_container}>
        <div className={styles.search_badge}>
          <RoomSearchBadge />
        </div>
        <div className={styles.search_input}>
          <RoomSearchInput />
        </div>
        <div className={styles.room_list}>
          {isLoading ? (
            <div className={styles.statePanel}>
              <ClipLoader color="#ffffff" size={36} aria-label="로딩 중" />
            </div>
          ) : isError ? (
            <div className={styles.statePanel}>새로고침을 시도해주세요.</div>
          ) : (
            <SearchPageRoomList
              rooms={roomListRooms}
              selectedRoomSlug={selectedRoomSlug}
            />
          )}
        </div>
        {!isLoading && !isError ? (
          <div className={styles.controlWrap}>
            {openPanel ? (
              <div className={styles.panelAnchor}>
                {openPanel === "menu" ? (
                  <HomeControlPanelShell
                    variant="menu"
                    activeMenuItem={activeMenuItem}
                    onSelectMenuItem={selectMenuItem}
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
              ariaLabel="검색 페이지 방 이동 컨트롤"
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
                selectedRoomSlug ? (
                  <Link
                    href={`/room/${encodeURIComponent(selectedRoomSlug)}`}
                    aria-label="방입장"
                  />
                ) : (
                  <button type="button" disabled aria-label="입장할 방 없음" />
                )
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
                    openPanel === "filter"
                      ? "필터 패널 닫기"
                      : "필터 패널 열기"
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

      <div className={styles.thumbnail_container}>
        <Image
          key={backgroundImageSrc}
          src={backgroundImageSrc}
          alt={selectedRoom ? `${selectedRoom.title} 대표 이미지` : "방 대표 이미지"}
          fill
          className={styles.thumbnail}
          priority
        />
      </div>
      {isCreateRoomModalOpen ? (
        <RoomFormModal
          open
          mode="create"
          onClose={() => setIsCreateRoomModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
