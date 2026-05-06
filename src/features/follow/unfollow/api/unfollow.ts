import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";
import type { UnfollowParams } from "../model/types";

export async function unfollow({
  targetSlug,
}: UnfollowParams): Promise<boolean> {
  const res = await axiosInstance.delete<ApiResponse<boolean>>(
    `/api/v1/friends/${targetSlug}`,
  );

  return res.data.result;
}
