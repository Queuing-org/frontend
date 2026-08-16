"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import RadialControl from "@/src/shared/ui/radial-control/RadialControl";
import HomeControlPanelShell, {
  HOME_CONTROL_PANEL_IDS,
  type HomeFilterKey,
  type HomeFilterOption,
  type HomeFilterState,
  type HomeGenreFilterOptionDescriptor,
  type HomeMenuItem,
} from "./HomeControlPanelShell";
import styles from "./HomeSearchControlDock.module.css";

type PanelKey = "menu" | "filter";

type Props = {
  ariaLabel: string;
  selectedRoomSlug: string | null;
  canGoPrevious: boolean;
  canGoNext: boolean;
  activeFilters: HomeFilterState;
  genreOptions: HomeGenreFilterOptionDescriptor[];
  onGoPrevious: () => void;
  onGoNext: () => void;
  onRandomEntry: () => void;
  onSelectFilter: (key: HomeFilterKey, option: HomeFilterOption) => void;
  onCreateRoom: () => void;
  onOpenFollow: () => void;
  onOpenSettings: () => void;
  onEnterSelectedRoom: () => void;
  isRandomEntryPending?: boolean;
  isNavigationLocked?: boolean;
};

export default function HomeSearchControlDock({
  ariaLabel,
  selectedRoomSlug,
  canGoPrevious,
  canGoNext,
  activeFilters,
  genreOptions,
  onGoPrevious,
  onGoNext,
  onRandomEntry,
  onSelectFilter,
  onCreateRoom,
  onOpenFollow,
  onOpenSettings,
  onEnterSelectedRoom,
  isRandomEntryPending = false,
  isNavigationLocked = false,
}: Props) {
  const dockRef = useRef<HTMLDivElement | null>(null);
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);
  const visiblePanel =
    isNavigationLocked && openPanel === "filter" ? null : openPanel;

  const togglePanel = (panel: PanelKey) => {
    setOpenPanel((currentPanel) => (currentPanel === panel ? null : panel));
  };

  useEffect(() => {
    if (!isNavigationLocked || openPanel !== "filter") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setOpenPanel((currentPanel) =>
        currentPanel === "filter" ? null : currentPanel,
      );
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isNavigationLocked, openPanel]);

  useEffect(() => {
    if (!visiblePanel) {
      return;
    }

    function closePanelOnOutsideClick(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (dockRef.current?.contains(target)) {
        return;
      }

      setOpenPanel(null);
    }

    document.addEventListener("pointerdown", closePanelOnOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", closePanelOnOutsideClick);
    };
  }, [visiblePanel]);

  const selectMenuItem = (menuItem: HomeMenuItem) => {
    setOpenPanel(null);

    if (menuItem === "CREATE") {
      onCreateRoom();
      return;
    }

    if (menuItem === "RANDOM") {
      onRandomEntry();
      return;
    }

    if (menuItem === "FOLLOW") {
      onOpenFollow();
      return;
    }

    if (menuItem === "SETTING") {
      onOpenSettings();
    }
  };

  return (
    <div
      ref={dockRef}
      className={styles.dock}
      data-modal-active={isNavigationLocked || undefined}
    >
      {visiblePanel ? (
        <div className={styles.floatStack}>
          {visiblePanel ? (
            <div className={styles.panelAnchor}>
              {visiblePanel === "menu" ? (
                <HomeControlPanelShell
                  variant="menu"
                  isRandomEntryPending={isRandomEntryPending}
                  onSelectMenuItem={selectMenuItem}
                />
              ) : (
                <HomeControlPanelShell
                  variant="filter"
                  activeFilters={activeFilters}
                  genreOptions={genreOptions}
                  onSelectFilter={onSelectFilter}
                />
              )}
            </div>
          ) : null}
        </div>
      ) : null}
      <RadialControl
        ariaLabel={ariaLabel}
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
            onClick={onGoPrevious}
            disabled={isNavigationLocked || !canGoPrevious}
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
          isNavigationLocked ? (
            <button
              type="button"
              disabled
              aria-label="모달 사용 중 방 입장 비활성"
            />
          ) : selectedRoomSlug ? (
            <button
              type="button"
              onClick={onEnterSelectedRoom}
              aria-label="방입장"
            />
          ) : (
            <button type="button" disabled aria-label="입장할 방 없음" />
          )
        }
        right={
          <button
            type="button"
            onClick={onGoNext}
            disabled={isNavigationLocked || !canGoNext}
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
          isNavigationLocked ? null : (
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
          )
        }
      />
    </div>
  );
}
