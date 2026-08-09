"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { followKeys } from "@/src/features/follow/model/queryKeys";
import type { FollowingUser } from "@/src/features/follow/model/types";
import { fetchAllFollowing } from "../api/fetchAllFollowing";

export const FOLLOWING_RELATIONSHIP_STALE_TIME_MS = 5 * 60 * 1000;

export function useFollowingRelationship(targetSlug: string | null) {
  return useQuery<FollowingUser[], ApiError, boolean>({
    queryKey: followKeys.followingRelationships(),
    queryFn: ({ signal }) => fetchAllFollowing(signal),
    select: (users) => users.some((user) => user.slug === targetSlug),
    enabled: Boolean(targetSlug),
    staleTime: FOLLOWING_RELATIONSHIP_STALE_TIME_MS,
  });
}
