import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";

export async function blockUser(userSlug: string): Promise<void> {
  const { data } = await axiosInstance.post<ApiResponse<unknown>>(
    `/api/v1/user-profiles/${encodeURIComponent(userSlug)}/blocks`,
  );

  unwrapApiResponse(data);
}
