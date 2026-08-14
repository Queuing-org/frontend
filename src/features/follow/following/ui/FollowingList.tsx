"use client";

import type { FollowingUser } from "@/src/features/follow/model/types";
import { useCallback } from "react";
import FollowListState from "@/src/features/follow/ui/FollowListState";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import { useInfiniteScrollSentinel } from "@/src/shared/lib/useInfiniteScrollSentinel";
import { useFollowingList } from "../hooks/useFollowingList";
import FollowingCard from "./FollowingCard";
import styles from "./FollowingList.module.css";

type Props = {
  onSelectUser: (user: FollowingUser, trigger: HTMLButtonElement) => void;
};

export default function FollowingList({ onSelectUser }: Props) {
  const query = useFollowingList({ size: 20 });
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;
  const followingUsers = Array.from(
    new Map(query.data.pages.flatMap((page) => page.items).map((user) => [user.slug, user])).values(),
  );
  const loadNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const sentinelRef = useInfiniteScrollSentinel({
    enabled: Boolean(query.hasNextPage) && !query.isFetchingNextPage && !query.isFetchNextPageError,
    onVisible: loadNextPage,
  });

  return (
    <>
      {followingUsers.length === 0 ? (
        <FollowListState raised>팔로잉한 사용자가 없습니다.</FollowListState>
      ) : (
        <div className={styles.container}>
          <ul className={styles.list}>
            {followingUsers.map((user) => (
              <FollowingCard key={user.slug} onSelect={onSelectUser} user={user} />
            ))}
          </ul>
          <div ref={sentinelRef} aria-hidden="true" />
          {query.isFetchingNextPage ? (
            <LoadingSpinner ariaLabel="팔로잉 더 불러오는 중" size={18} />
          ) : null}
          {query.isFetchNextPageError ? (
            <button type="button" onClick={loadNextPage}>다시 시도</button>
          ) : null}
        </div>
      )}
    </>
  );
}
