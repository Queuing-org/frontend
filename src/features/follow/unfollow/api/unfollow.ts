import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  assertApiBooleanResult,
  unwrapApiResponse,
} from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import type { UnfollowParams } from "../model/types";

export async function unfollow({
  targetSlug,
}: UnfollowParams): Promise<boolean> {
  const res = await axiosInstance.delete<ApiResponse<boolean>>(
    `/api/v1/follows/${encodeURIComponent(targetSlug)}`,
  );

  return assertApiBooleanResult(
    unwrapApiResponse(res.data),
    "언팔로우하지 못했습니다.",
  );
}
