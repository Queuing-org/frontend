"use client";

import type { QueueTab } from "../model/roomQueue";
import styles from "./RoomQueueTabs.module.css";

type Props = {
  activeTab: QueueTab;
  allCount: number;
  myCount: number;
  onChange: (nextTab: QueueTab) => void;
};

export default function RoomQueueTabs({
  activeTab,
  allCount,
  myCount,
  onChange,
}: Props) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="플레이리스트 탭">
      <button
        type="button"
        role="tab"
        className={styles.tab}
        aria-selected={activeTab === "all"}
        data-active={activeTab === "all"}
        onClick={() => onChange("all")}
      >
        전체 트랙
        <span className={styles.tabCount}>{allCount}</span>
      </button>
      <button
        type="button"
        role="tab"
        className={styles.tab}
        aria-selected={activeTab === "mine"}
        data-active={activeTab === "mine"}
        onClick={() => onChange("mine")}
      >
        내 신청곡
        <span className={styles.tabCount}>{myCount}</span>
      </button>
    </div>
  );
}
