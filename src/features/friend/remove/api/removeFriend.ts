import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { RemoveFriendParams } from "../model/types";
import { ApiResponse } from "@/src/shared/api/types";

export async function removeFriend({
  targetSlug,
}: RemoveFriendParams): Promise<boolean> {
  const res = await axiosInstance.delete<ApiResponse<boolean>>(
    `/api/v1/friends/${targetSlug}`
  );

  return res.data.result;
}
