"use client";

import BlockedUsersPanel from "@/src/features/follow/blocked/ui/BlockedUsersPanel";
import FollowersPanel from "@/src/features/follow/followers/ui/FollowersPanel";
import FollowingPanel from "@/src/features/follow/following/ui/FollowingPanel";
import type { FollowTab } from "@/src/features/follow/hooks/useFollowModalState";
import type { FollowUser } from "@/src/features/follow/model/types";
import styles from "../FollowModal.module.css";

type FollowTabPanelProps = {
  activeTab: FollowTab;
  onSelectUser: (user: FollowUser, trigger: HTMLButtonElement) => void;
};

export default function FollowTabPanel({
  activeTab,
  onSelectUser,
}: FollowTabPanelProps) {
  const panel =
    activeTab === "following" ? (
      <FollowingPanel onSelectUser={onSelectUser} />
    ) : activeTab === "followers" ? (
      <FollowersPanel onSelectUser={onSelectUser} />
    ) : (
      <BlockedUsersPanel />
    );

  return <div className={styles.tabPanel}>{panel}</div>;
}
