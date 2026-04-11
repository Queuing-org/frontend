"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRoomsQuery } from "@/src/entities/room/hooks/useFetchRooms";
import { useRoomNavigator } from "@/src/shared/lib/useRoomNavigator";
import RadialControl from "@/src/shared/ui/radial-control/RadialControl";
import HomeControlPanelShell, {
  HOME_CONTROL_PANEL_IDS,
} from "./HomeControlPanelShell";
import HomeTopBar from "./HomeTopBar";
import HomeRoomStage from "@/src/features/room/list/ui/HomeRoomStage";
import styles from "./HomeScreen.module.css";

type HomePanelKey = "menu" | "filter";

export default function HomeScreen() {
  const [openPanel, setOpenPanel] = useState<HomePanelKey | null>(null);
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
              <HomeControlPanelShell variant={openPanel} />
            </div>
          ) : null}
          <RadialControl
            ariaLabel="홈 하단 컨트롤"
            top={
              <button
                type="button"
                className={styles.controlToggle}
                onClick={() => togglePanel("menu")}
                aria-controls={HOME_CONTROL_PANEL_IDS.menu}
                aria-expanded={openPanel === "menu"}
                data-active={openPanel === "menu"}
              >
                {openPanel === "menu" ? "X" : "MENU"}
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
                aria-controls={HOME_CONTROL_PANEL_IDS.filter}
                aria-expanded={openPanel === "filter"}
                data-active={openPanel === "filter"}
              >
                {openPanel === "filter" ? "X" : "FILTER"}
              </button>
            }
          />
        </div>
      ) : null}
    </div>
  );
}
