import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";
import type { AcceptFollowRequestParams } from "../model/types";

export async function acceptFollowRequest(
  params: AcceptFollowRequestParams,
): Promise<boolean> {
  const res = await axiosInstance.patch<ApiResponse<boolean>>(
    `/api/v1/friend-requests/${params.requestId}`,
  );

  return res.data.result;
}
