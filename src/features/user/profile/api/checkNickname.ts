import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";

export async function checkNickname(nickname: string): Promise<boolean> {
  const res = await axiosInstance.get<ApiResponse<boolean>>(
    "/api/v1/user-profiles/check-nickname",
    {
      params: { nickname },
    }
  );

  return res.data.result;
}
