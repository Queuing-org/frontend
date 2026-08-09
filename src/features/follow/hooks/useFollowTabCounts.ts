"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchFollowers } from "@/src/features/follow/followers/api/fetchFollowers";
import { fetchFollowing } from "@/src/features/follow/following/api/fetchFollowing";
import { followKeys } from "@/src/features/follow/model/queryKeys";
import type { FollowListResponse } from "@/src/features/follow/model/types";

export const FOLLOW_TAB_COUNT_PAGE_SIZE = 100;

export function formatFollowTabCount(data: FollowListResponse): string {
  return data.hasNext
    ? `${FOLLOW_TAB_COUNT_PAGE_SIZE}+`
    : `${data.items.length}`;
}

export function useFollowTabCounts(enabled: boolean) {
  const following = useQuery({
    queryKey: followKeys.followings(undefined, FOLLOW_TAB_COUNT_PAGE_SIZE),
    queryFn: () => fetchFollowing({ size: FOLLOW_TAB_COUNT_PAGE_SIZE }),
    enabled,
  });
  const followers = useQuery({
    queryKey: followKeys.followers(undefined, FOLLOW_TAB_COUNT_PAGE_SIZE),
    queryFn: () => fetchFollowers({ size: FOLLOW_TAB_COUNT_PAGE_SIZE }),
    enabled,
  });

  return {
    ...(following.data
      ? { following: formatFollowTabCount(following.data) }
      : {}),
    ...(followers.data
      ? { followers: formatFollowTabCount(followers.data) }
      : {}),
  } satisfies Partial<Record<"following" | "followers", string>>;
}
