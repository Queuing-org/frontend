import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  assertApiBooleanResult,
  unwrapApiResponse,
} from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import type { FollowParams } from "../model/types";

export async function follow({ targetSlug }: FollowParams): Promise<boolean> {
  const res = await axiosInstance.post<ApiResponse<boolean>>(
    "/api/v1/follows",
    { targetSlug },
  );

  return assertApiBooleanResult(
    unwrapApiResponse(res.data),
    "팔로우하지 못했습니다.",
  );
}
