import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import type { FollowingListResponse } from "@/src/features/follow/model/types";
import { fetchFollowing } from "../api/fetchFollowing";
import type { FetchFollowingParams } from "../model/types";
import { followKeys } from "@/src/features/follow/model/queryKeys";

export function useFollowingList(
  params?: FetchFollowingParams,
  options: { enabled?: boolean } = {},
) {
  return useQuery<FollowingListResponse, ApiError>({
    queryKey: followKeys.followings(params?.lastId, params?.size),
    queryFn: () => fetchFollowing(params),
    enabled: options.enabled ?? true,
    retry: false,
  });
}
