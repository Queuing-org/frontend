"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { fetchPublicUserBadges } from "../api/fetchPublicUserBadges";
import type { PublicUserBadgeList } from "../model/types";
import { badgeKeys } from "../model/queryKeys";

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
    queryFn: () => fetchPublicUserBadges(userSlug),
    retry: false,
  };
}

export function usePublicUserBadges(userSlug: string | null | undefined) {
  return useQuery<PublicUserBadgeList, ApiError>({
    queryKey: badgeKeys.publicUser(userSlug),
    queryFn: () => fetchPublicUserBadges(userSlug!),
    enabled: Boolean(userSlug),
    retry: false,
  });
}
