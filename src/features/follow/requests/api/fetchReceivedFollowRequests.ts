import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";
import type {
  FetchReceivedFollowRequestsParams,
  ReceivedFollowRequestsResponse,
} from "../model/types";

export async function fetchReceivedFollowRequests(
  params?: FetchReceivedFollowRequestsParams,
): Promise<ReceivedFollowRequestsResponse> {
  const res = await axiosInstance.get<
    ApiResponse<ReceivedFollowRequestsResponse>
  >("/api/v1/friend-requests", { params });

  return res.data.result;
}
