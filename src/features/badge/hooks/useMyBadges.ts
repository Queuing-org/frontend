"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { fetchMyBadges } from "../api/fetchMyBadges";
import type { UserBadgeList } from "../model/types";
import { badgeKeys } from "../model/queryKeys";

export function useMyBadges(enabled = true) {
  return useQuery<UserBadgeList, ApiError>({
    queryKey: badgeKeys.me(),
    queryFn: fetchMyBadges,
    enabled,
    retry: false,
  });
}
