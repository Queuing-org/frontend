"use client";

import { useCallback, useState } from "react";
import BlockUserModal, {
  type BlockUserTarget,
} from "@/src/features/follow/blocked/ui/BlockUserModal";
import type { FollowingUser } from "@/src/features/follow/model/types";
import FollowListState from "@/src/features/follow/ui/FollowListState";
import { useFollowingList } from "../hooks/useFollowingList";
import FollowingCard from "./FollowingCard";
import styles from "./FollowingList.module.css";

export default function FollowingList() {
  const { data } = useFollowingList({ size: 100 });
  const followingUsers = data.items;
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [blockTarget, setBlockTarget] = useState<BlockUserTarget | null>(null);
  const handleToggle = useCallback((slug: string) => {
    setExpandedSlug((current) => (current === slug ? null : slug));
  }, []);
  const handleBlock = useCallback((user: FollowingUser) => {
    setBlockTarget({ nickname: user.nickname, slug: user.slug });
  }, []);
  const handleBlockClose = useCallback(() => setBlockTarget(null), []);

  if (followingUsers.length === 0) {
    return <FollowListState>팔로잉한 사용자가 없습니다.</FollowListState>;
  }

  return (
    <div className={styles.container}>
      <ul className={styles.list}>
        {followingUsers.map((user) => (
          <FollowingCard
            key={user.slug}
            expanded={expandedSlug === user.slug}
            onBlock={handleBlock}
            onToggle={handleToggle}
            user={user}
          />
        ))}
      </ul>
      <BlockUserModal
        target={blockTarget}
        onBlocked={() => setExpandedSlug(null)}
        onClose={handleBlockClose}
      />
    </div>
  );
}
