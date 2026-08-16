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
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";

export default function BlockedUsersList() {
  const blockedUsers = useBlockedUsers();
  const unblockUser = useUnblockUser();
  const pendingUnblockSlugs = usePendingUnblockUserSlugs();
  const { notify } = useActionFeedback();
  const users = blockedUsers.data.pages.flatMap((page) => page.items);
  const handleUnblock = useCallback(
    (slug: string) => {
      if (pendingUnblockSlugs.includes(slug)) {
        return;
      }
      unblockUser.reset();
      const target = users.find((user) => user.slug === slug);
      unblockUser.mutate(slug, {
        onSuccess: () => {
          notify({
            dedupeKey: `unblock:${slug}`,
            message: `'${target?.nickname ?? "사용자"}'님의 차단을 해제했습니다.`,
            tone: "default",
          });
        },
        onError: (error) => {
          notify({
            dedupeKey: `unblock:${slug}`,
            message: error.message || "차단을 해제하지 못했습니다.",
            tone: "error",
          });
        },
      });
    },
    [notify, pendingUnblockSlugs, unblockUser, users],
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
