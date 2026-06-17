import type { FollowingListResponse } from "@/src/features/follow/model/types";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import type { FetchFollowingParams } from "../model/types";

export async function fetchFollowing(
  params?: FetchFollowingParams,
): Promise<FollowingListResponse> {
  const res = await axiosInstance.get<ApiResponse<FollowingListResponse>>(
    "/api/v1/follows/followings",
    { params },
  );

  return unwrapApiResponse(res.data);
}
