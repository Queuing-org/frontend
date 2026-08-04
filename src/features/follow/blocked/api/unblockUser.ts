import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  assertApiBooleanResult,
  unwrapApiResponse,
} from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";

export async function unblockUser(userSlug: string): Promise<boolean> {
  const { data } = await axiosInstance.delete<ApiResponse<boolean>>(
    `/api/v1/user-profiles/${encodeURIComponent(userSlug)}/blocks`,
  );

  return assertApiBooleanResult(
    unwrapApiResponse(data),
    "차단을 해제하지 못했습니다.",
  );
}
