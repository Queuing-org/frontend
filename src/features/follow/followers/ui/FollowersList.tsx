"use client";

import type { FollowerUser } from "@/src/features/follow/model/types";
import { useCallback } from "react";
import FollowListState from "@/src/features/follow/ui/FollowListState";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import { useInfiniteScrollSentinel } from "@/src/shared/lib/useInfiniteScrollSentinel";
import { useFollowersList } from "../hooks/useFollowersList";
import FollowerCard from "./FollowerCard";
import styles from "./FollowersList.module.css";

type Props = {
  onSelectUser: (user: FollowerUser, trigger: HTMLButtonElement) => void;
};

export default function FollowersList({ onSelectUser }: Props) {
  const query = useFollowersList({ size: 20 });
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;
  const followers = Array.from(
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
      {followers.length === 0 ? (
        <FollowListState raised>팔로워가 없습니다.</FollowListState>
      ) : (
        <div className={styles.container}>
          <ul className={styles.list}>
            {followers.map((user) => (
              <FollowerCard key={user.slug} onSelect={onSelectUser} user={user} />
            ))}
          </ul>
          <div ref={sentinelRef} aria-hidden="true" />
          {query.isFetchingNextPage ? (
            <LoadingSpinner ariaLabel="팔로워 더 불러오는 중" size={18} />
          ) : null}
          {query.isFetchNextPageError ? (
            <button type="button" onClick={loadNextPage}>다시 시도</button>
          ) : null}
        </div>
      )}
    </>
  );
}
