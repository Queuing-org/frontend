// features/friend/requests/api/sendFriendRequest.ts
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";
import type { SendFriendRequestPayload } from "../model/types";

export async function sendFriendRequest(
  payload: SendFriendRequestPayload
): Promise<boolean> {
  const res = await axiosInstance.post<ApiResponse<boolean>>(
    "/api/v1/friend-requests",
    payload
  );
  return res.data.result;
}
