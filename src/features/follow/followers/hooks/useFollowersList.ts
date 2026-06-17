import { useSuspenseQuery } from "@tanstack/react-query";
import type { FollowersListResponse } from "@/src/features/follow/model/types";
import type { ApiError } from "@/src/shared/api/api-error";
import { fetchFollowers } from "../api/fetchFollowers";
import type { FetchFollowersParams } from "../model/types";
import { followKeys } from "@/src/features/follow/model/queryKeys";

export function useFollowersList(
  params?: FetchFollowersParams,
) {
  return useSuspenseQuery<FollowersListResponse, ApiError>({
    queryKey: followKeys.followers(params?.lastId, params?.size),
    queryFn: () => fetchFollowers(params),
    retry: false,
  });
}
