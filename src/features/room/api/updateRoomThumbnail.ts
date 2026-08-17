import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  assertApiBooleanResult,
  unwrapApiResponse,
} from "@/src/shared/api/api-response";
import { ApiError } from "@/src/shared/api/api-error";
import type { ApiResponse } from "@/src/shared/api/types";
import { buildRoomAccessTokenHeaders } from "@/src/shared/api/roomAccessTokenHeaders";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type {
  UpdateRoomThumbnailParams,
  UpdateRoomThumbnailResult,
} from "./types";

type UpdateRoomThumbnailResponse = ApiResponse<boolean>;

export async function updateRoomThumbnail({
  accessToken,
  slug,
  thumbnailUploadToken,
}: UpdateRoomThumbnailParams): Promise<UpdateRoomThumbnailResult> {
  const normalizedSlug = normalizeRoomSlug(slug);
  const normalizedToken = thumbnailUploadToken.trim();

  if (!normalizedToken) {
    throw new ApiError({
      message: "썸네일 업로드 token이 필요합니다.",
      status: 400,
    });
  }

  const response = await axiosInstance.put<UpdateRoomThumbnailResponse>(
    `/api/v2/rooms/${encodeURIComponent(normalizedSlug)}/thumbnail`,
    { thumbnailUploadToken: normalizedToken },
    { headers: buildRoomAccessTokenHeaders(accessToken) },
  );

  return {
    success: assertApiBooleanResult(
      unwrapApiResponse(response.data),
      "방 썸네일을 교체하지 못했습니다.",
    ),
  };
}
