import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";
import type { FollowParams } from "../model/types";

export async function follow({ targetSlug }: FollowParams): Promise<boolean> {
  const res = await axiosInstance.post<ApiResponse<boolean>>(
    "/api/v1/follows",
    { targetSlug },
  );

  return res.data.result;
}
