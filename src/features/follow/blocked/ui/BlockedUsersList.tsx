"use client";

import { useCallback } from "react";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import FollowListState from "@/src/features/follow/ui/FollowListState";
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
    return <FollowListState raised>차단된 사용자가 없습니다.</FollowListState>;
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
          {blockedUsers.isFetchingNextPage ? (
            <LoadingSpinner ariaLabel="차단 사용자 더 불러오는 중" size={16} />
          ) : (
            "더 보기"
          )}
        </button>
      ) : null}
    </div>
  );
}
