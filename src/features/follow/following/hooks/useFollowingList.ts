import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import type { FollowingListResponse } from "@/src/entities/follow/model/types";
import { fetchFollowing } from "../api/fetchFollowing";
import type { FetchFollowingParams } from "../model/types";

export function useFollowingList(params?: FetchFollowingParams) {
  return useQuery<FollowingListResponse, ApiError>({
    queryKey: ["following", params?.lastId ?? null, params?.size ?? null],
    queryFn: () => fetchFollowing(params),
    retry: false,
  });
}
