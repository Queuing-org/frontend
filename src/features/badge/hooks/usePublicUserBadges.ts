"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { fetchPublicUserBadges } from "../api/fetchPublicUserBadges";
import type { PublicUserBadgeList } from "../model/types";
import { badgeKeys } from "../model/queryKeys";

export const PUBLIC_USER_BADGES_STALE_TIME_MS = 5 * 60 * 1000;

export function publicUserBadgesQueryOptions(
  userSlug: string,
): UseQueryOptions<
  PublicUserBadgeList,
  ApiError,
  PublicUserBadgeList,
  ReturnType<typeof badgeKeys.publicUser>
> {
  return {
    queryKey: badgeKeys.publicUser(userSlug),
    queryFn: ({ signal }) => fetchPublicUserBadges(userSlug, signal),
    staleTime: PUBLIC_USER_BADGES_STALE_TIME_MS,
  };
}

export function usePublicUserBadges(userSlug: string | null | undefined) {
  return useQuery<PublicUserBadgeList, ApiError>({
    queryKey: badgeKeys.publicUser(userSlug),
    queryFn: ({ signal }) => fetchPublicUserBadges(userSlug!, signal),
    enabled: Boolean(userSlug),
    staleTime: PUBLIC_USER_BADGES_STALE_TIME_MS,
  });
}
