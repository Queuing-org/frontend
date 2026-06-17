"use client";

import BlockedUsersPanel from "@/src/features/follow/blocked/ui/BlockedUsersPanel";
import FollowersPanel from "@/src/features/follow/followers/ui/FollowersPanel";
import FollowingPanel from "@/src/features/follow/following/ui/FollowingPanel";
import type { FollowTab } from "@/src/features/follow/hooks/useFollowModalState";
import styles from "../FollowModal.module.css";

type FollowTabPanelProps = {
  activeTab: FollowTab;
};

export default function FollowTabPanel({ activeTab }: FollowTabPanelProps) {
  const panel =
    activeTab === "following" ? (
      <FollowingPanel />
    ) : activeTab === "followers" ? (
      <FollowersPanel />
    ) : (
      <BlockedUsersPanel />
    );

  return <div className={styles.tabPanel}>{panel}</div>;
}
