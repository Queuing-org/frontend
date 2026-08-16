import type { FollowersListResponse } from "@/src/features/follow/model/types";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import type { FetchFollowersParams } from "../model/types";

export async function fetchFollowers(
  params?: FetchFollowersParams,
  signal?: AbortSignal,
): Promise<FollowersListResponse> {
  const res = await axiosInstance.get<ApiResponse<FollowersListResponse>>(
    "/api/v1/user-profiles/me/followers",
    { params, signal },
  );

  return unwrapApiResponse(res.data);
}
