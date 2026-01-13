import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { User } from "@/src/entities/user/model/types";
import type { UpdateMePayload } from "../model/types";
import { ApiResponse } from "@/src/shared/api/types";

export async function updateMe(payload: UpdateMePayload): Promise<User> {
  const { data } = await axiosInstance.patch<ApiResponse<User>>(
    "/api/v1/user-profiles/me",
    payload
  );
  return data.result;
}
