import type { FollowersListResponse } from "@/src/entities/follow/model/types";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";
import type { FetchFollowersParams } from "../model/types";

export async function fetchFollowers(
  params?: FetchFollowersParams,
): Promise<FollowersListResponse> {
  const res = await axiosInstance.get<ApiResponse<FollowersListResponse>>(
    "/api/v1/follows/followers",
    { params },
  );

  return res.data.result;
}
