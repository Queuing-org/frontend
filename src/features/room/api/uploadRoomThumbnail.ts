import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  assertApiBooleanResult,
  unwrapApiResponse,
} from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export type UploadRoomThumbnailParams = {
  slug: string;
  file: File;
};

export type UploadRoomThumbnailResult = {
  success: boolean;
};

type UploadRoomThumbnailResponse = ApiResponse<boolean>;

export async function uploadRoomThumbnail({
  slug,
  file,
}: UploadRoomThumbnailParams): Promise<UploadRoomThumbnailResult> {
  const normalizedSlug = normalizeRoomSlug(slug);
  const formData = new FormData();
  formData.append("file", file);

  const res = await axiosInstance.put<UploadRoomThumbnailResponse>(
    `/api/v1/rooms/${encodeURIComponent(normalizedSlug)}/thumbnail`,
    formData,
  );

  return {
    success: assertApiBooleanResult(
      unwrapApiResponse(res.data),
      "방 썸네일을 업로드하지 못했습니다.",
    ),
  };
}
