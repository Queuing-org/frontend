import { ApiError } from "@/src/shared/api/api-error";
import {
  assertApiBooleanResult,
  unwrapApiResponse,
} from "@/src/shared/api/api-response";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";
import { buildRoomAccessTokenHeaders } from "@/src/shared/api/roomAccessTokenHeaders";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export type TransferRoomOwnerParams = {
  accessToken: string;
  slug: string;
  userSlug: string;
};

export async function transferRoomOwner({
  accessToken,
  slug,
  userSlug,
}: TransferRoomOwnerParams): Promise<boolean> {
  const normalizedUserSlug = userSlug.trim();
  if (!normalizedUserSlug) {
    throw new ApiError({
      message: "새 방장 식별자가 올바르지 않습니다.",
      status: 400,
    });
  }

  const response = await axiosInstance.patch<ApiResponse<boolean>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}/owner`,
    { userSlug: normalizedUserSlug },
    { headers: buildRoomAccessTokenHeaders(accessToken) },
  );

  return assertApiBooleanResult(
    unwrapApiResponse(response.data),
    "방장을 위임하지 못했습니다.",
  );
}
