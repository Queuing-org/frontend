"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { followKeys } from "@/src/features/follow/model/queryKeys";
import type { FollowingListResponse } from "@/src/features/follow/model/types";
import { fetchFollowing } from "../api/fetchFollowing";

const FOLLOWING_RELATIONSHIP_CHECK_SIZE = 200;

export function useFollowingRelationship(targetSlug: string | null) {
  return useQuery<FollowingListResponse, ApiError, boolean>({
    queryKey: followKeys.followings(
      undefined,
      FOLLOWING_RELATIONSHIP_CHECK_SIZE,
    ),
    queryFn: () =>
      fetchFollowing({
        size: FOLLOWING_RELATIONSHIP_CHECK_SIZE,
      }),
    select: (data) => data.items.some((user) => user.slug === targetSlug),
    enabled: Boolean(targetSlug),
    retry: false,
  });
}
