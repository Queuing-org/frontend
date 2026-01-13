import type { FriendsListResponse } from "@/src/entities/friend/model/types";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";
import { FetchFriendsParams } from "../model/types";

export async function fetchFriends(
  params?: FetchFriendsParams
): Promise<FriendsListResponse> {
  const res = await axiosInstance.get<ApiResponse<FriendsListResponse>>(
    "/api/v1/friends",
    { params }
  );

  return res.data.result;
}
