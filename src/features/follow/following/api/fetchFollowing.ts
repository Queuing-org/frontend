import type { FollowingListResponse } from "@/src/entities/follow/model/types";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";
import type { FetchFollowingParams } from "../model/types";

export async function fetchFollowing(
  params?: FetchFollowingParams,
): Promise<FollowingListResponse> {
  const res = await axiosInstance.get<ApiResponse<FollowingListResponse>>(
    "/api/v1/friends",
    { params },
  );

  return res.data.result;
}
