"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import RadialControl from "@/src/shared/ui/radial-control/RadialControl";
import HomeControlPanelShell, {
  HOME_CONTROL_PANEL_IDS,
  type HomeFilterKey,
  type HomeFilterOption,
  type HomeFilterState,
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
  onGoPrevious: () => void;
  onGoNext: () => void;
  onSelectFilter: (key: HomeFilterKey, option: HomeFilterOption) => void;
  onCreateRoom: () => void;
};

export default function HomeSearchControlDock({
  ariaLabel,
  selectedRoomSlug,
  canGoPrevious,
  canGoNext,
  activeFilters,
  onGoPrevious,
  onGoNext,
  onSelectFilter,
  onCreateRoom,
}: Props) {
  const dockRef = useRef<HTMLDivElement | null>(null);
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);

  const togglePanel = (panel: PanelKey) => {
    setOpenPanel((currentPanel) => (currentPanel === panel ? null : panel));
  };

  useEffect(() => {
    if (!openPanel) {
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
  }, [openPanel]);

  const selectMenuItem = (menuItem: HomeMenuItem) => {
    setOpenPanel(null);

    if (menuItem === "CREATE") {
      onCreateRoom();
    }
  };

  return (
    <div ref={dockRef} className={styles.dock}>
      {openPanel ? (
        <div className={styles.panelAnchor}>
          {openPanel === "menu" ? (
            <HomeControlPanelShell
              variant="menu"
              onSelectMenuItem={selectMenuItem}
            />
          ) : (
            <HomeControlPanelShell
              variant="filter"
              activeFilters={activeFilters}
              onSelectFilter={onSelectFilter}
            />
          )}
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
            disabled={!canGoPrevious}
            aria-label="이전 방 보기"
          >
            <Image src="/icons/left_arrow.svg" alt="" width={20} height={20} />
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
            onClick={onGoNext}
            disabled={!canGoNext}
            aria-label="다음 방 보기"
          >
            <Image src="/icons/right_arrow.svg" alt="" width={20} height={20} />
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
  );
}
