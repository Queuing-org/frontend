"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { userKeys } from "@/src/features/user/model/queryKeys";
import { fetchUserProfile } from "../api/fetchUserProfile";
import type { UserProfile } from "../model/types";

export function useUserProfile(userSlug: string | null | undefined) {
  return useQuery<UserProfile, ApiError>({
    queryKey: userKeys.profile(userSlug),
    queryFn: () => fetchUserProfile(userSlug!),
    enabled: Boolean(userSlug),
    retry: false,
  });
}
