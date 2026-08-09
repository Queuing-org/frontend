"use client";

import { useCallback, useState } from "react";
import BlockUserModal, {
  type BlockUserTarget,
} from "@/src/features/follow/blocked/ui/BlockUserModal";
import type { FollowerUser } from "@/src/features/follow/model/types";
import FollowListState from "@/src/features/follow/ui/FollowListState";
import { useFollowersList } from "../hooks/useFollowersList";
import FollowerCard from "./FollowerCard";
import styles from "./FollowersList.module.css";

export default function FollowersList() {
  const { data } = useFollowersList({ size: 100 });
  const followers = data.items;
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [blockTarget, setBlockTarget] = useState<BlockUserTarget | null>(null);
  const handleToggle = useCallback((slug: string) => {
    setExpandedSlug((current) => (current === slug ? null : slug));
  }, []);
  const handleBlock = useCallback((user: FollowerUser) => {
    setBlockTarget({ nickname: user.nickname, slug: user.slug });
  }, []);
  const handleBlockClose = useCallback(() => setBlockTarget(null), []);

  if (followers.length === 0) {
    return <FollowListState raised>팔로워가 없습니다.</FollowListState>;
  }

  return (
    <div className={styles.container}>
      <ul className={styles.list}>
        {followers.map((user) => (
          <FollowerCard
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
