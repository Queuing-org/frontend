import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";
import type {
  ReceivedFriendRequestsResponse,
  FetchReceivedFriendRequestsParams,
} from "../model/types";

export async function fetchReceivedFriendRequests(
  params?: FetchReceivedFriendRequestsParams
): Promise<ReceivedFriendRequestsResponse> {
  const res = await axiosInstance.get<
    ApiResponse<ReceivedFriendRequestsResponse>
  >("/api/v1/friend-requests", { params });

  return res.data.result;
}
