import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { UpdateMePayload } from "../model/types";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";

export async function updateMe(payload: UpdateMePayload): Promise<boolean> {
  const { data } = await axiosInstance.patch<ApiResponse<boolean>>(
    "/api/v1/user-profiles/me",
    payload,
  );

  return unwrapApiResponse(data);
}
