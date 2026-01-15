import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";
import type { AcceptFriendRequestParams } from "../model/types";

export async function acceptFriendRequest(
  params: AcceptFriendRequestParams
): Promise<boolean> {
  const res = await axiosInstance.patch<ApiResponse<boolean>>(
    `/api/v1/friend-requests/${params.requestId}`
  );

  return res.data.result;
}
