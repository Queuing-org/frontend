import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  assertApiBooleanResult,
  unwrapApiResponse,
} from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import { buildRoomAccessTokenHeaders } from "@/src/shared/api/roomAccessTokenHeaders";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type {
  DeleteRoomThumbnailParams,
  DeleteRoomThumbnailResult,
} from "./types";

type DeleteRoomThumbnailResponse = ApiResponse<boolean>;

export async function deleteRoomThumbnail({
  accessToken,
  slug,
}: DeleteRoomThumbnailParams): Promise<DeleteRoomThumbnailResult> {
  const normalizedSlug = normalizeRoomSlug(slug);
  const response = await axiosInstance.delete<DeleteRoomThumbnailResponse>(
    `/api/v2/rooms/${encodeURIComponent(normalizedSlug)}/thumbnail`,
    { headers: buildRoomAccessTokenHeaders(accessToken) },
  );

  return {
    success: assertApiBooleanResult(
      unwrapApiResponse(response.data),
      "방 썸네일을 삭제하지 못했습니다.",
    ),
  };
}
