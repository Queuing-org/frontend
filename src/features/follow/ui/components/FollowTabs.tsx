"use client";

import type { CSSProperties } from "react";
import type { FollowTab } from "@/src/features/follow/hooks/useFollowModalState";
import styles from "../FollowModal.module.css";

const followTabs: Array<{ key: FollowTab; label: string; iconSrc: string }> = [
  { key: "following", label: "팔로잉", iconSrc: "/icons/follwer.svg" },
  { key: "followers", label: "팔로워", iconSrc: "/icons/follwer.svg" },
  { key: "blocked", label: "차단", iconSrc: "/icons/block.svg" },
];

type FollowTabsProps = {
  activeTab: FollowTab;
  counts: Partial<Record<FollowTab, string>>;
  onChange: (tab: FollowTab) => void;
};

export default function FollowTabs({
  activeTab,
  counts,
  onChange,
}: FollowTabsProps) {
  return (
    <aside className={styles.sidebar} aria-label="팔로우 탭">
      {followTabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={styles.tabButton}
          data-active={activeTab === tab.key}
          onClick={() => onChange(tab.key)}
        >
          <span
            className={styles.tabIcon}
            style={
              {
                "--tab-icon-src": `url(${tab.iconSrc})`,
              } as CSSProperties
            }
            aria-hidden="true"
          />
          <span className={styles.tabLabel}>{tab.label}</span>
          {counts[tab.key] ? (
            <span className={styles.tabCount}>({counts[tab.key]})</span>
          ) : null}
        </button>
      ))}
    </aside>
  );
}
