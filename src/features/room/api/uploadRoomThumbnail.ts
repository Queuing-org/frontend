import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  unwrapApiResponse,
} from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { ThumbnailUrls } from "@/src/features/room/model/types";

export type UploadRoomThumbnailParams = {
  slug: string;
  file: File;
};

export type UploadRoomThumbnailResult = {
  width?: number;
  height?: number;
  sizeBytes?: number;
  activatedAt?: string;
  contentType?: string;
  thumbnailUrl?: string | null;
  thumbnailUrls?: ThumbnailUrls | null;
};

type UploadRoomThumbnailResponse = ApiResponse<UploadRoomThumbnailResult>;

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

  return unwrapApiResponse(res.data);
}
