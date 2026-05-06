import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";
import type { SendFollowRequestPayload } from "../model/types";

export async function sendFollowRequest(
  payload: SendFollowRequestPayload,
): Promise<boolean> {
  const res = await axiosInstance.post<ApiResponse<boolean>>(
    "/api/v1/friend-requests",
    payload,
  );
  return res.data.result;
}
