import { useQuery } from "@tanstack/react-query";
import type { FollowersListResponse } from "@/src/entities/follow/model/types";
import type { ApiError } from "@/src/shared/api/api-error";
import { fetchFollowers } from "../api/fetchFollowers";
import type { FetchFollowersParams } from "../model/types";

export function useFollowersList(
  params?: FetchFollowersParams,
  options: { enabled?: boolean } = {},
) {
  return useQuery<FollowersListResponse, ApiError>({
    queryKey: [
      "follows",
      "followers",
      params?.lastId ?? null,
      params?.size ?? null,
    ],
    queryFn: () => fetchFollowers(params),
    enabled: options.enabled ?? true,
    retry: false,
  });
}
