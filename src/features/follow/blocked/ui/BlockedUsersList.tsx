"use client";

import { useCallback } from "react";
import { useBlockedUsers } from "../hooks/useBlockedUsers";
import {
  usePendingUnblockUserSlugs,
  useUnblockUser,
} from "../hooks/useUnblockUser";
import BlockedUserCard from "./BlockedUserCard";
import styles from "./BlockedUsersPanel.module.css";

export default function BlockedUsersList() {
  const blockedUsers = useBlockedUsers();
  const unblockUser = useUnblockUser();
  const pendingUnblockSlugs = usePendingUnblockUserSlugs();
  const users = blockedUsers.data.pages.flatMap((page) => page.items);
  const handleUnblock = useCallback(
    (slug: string) => {
      if (pendingUnblockSlugs.includes(slug)) {
        return;
      }
      unblockUser.reset();
      unblockUser.mutate(slug);
    },
    [pendingUnblockSlugs, unblockUser],
  );

  if (users.length === 0) {
    return <div className={styles.state}>차단한 사용자가 없습니다.</div>;
  }

  return (
    <div className={styles.container}>
      <ul className={styles.list}>
        {users.map((user) => (
          <BlockedUserCard
            key={user.slug}
            isPending={pendingUnblockSlugs.includes(user.slug)}
            onUnblock={handleUnblock}
            user={user}
          />
        ))}
      </ul>

      {unblockUser.error ? (
        <p className={styles.error} role="alert">
          {unblockUser.error.message}
        </p>
      ) : null}

      {blockedUsers.hasNextPage ? (
        <button
          type="button"
          className={styles.loadMoreButton}
          disabled={blockedUsers.isFetchingNextPage}
          onClick={() => void blockedUsers.fetchNextPage()}
        >
          {blockedUsers.isFetchingNextPage ? "불러오는 중..." : "더 보기"}
        </button>
      ) : null}
    </div>
  );
}
