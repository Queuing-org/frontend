import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import type { ThumbnailUrls } from "@/src/features/room/model/types";
import { ApiError } from "@/src/shared/api/api-error";

export type UploadTemporaryRoomThumbnailParams = {
  file: File;
};

export type UploadTemporaryRoomThumbnailResult = {
  width?: number;
  height?: number;
  expiresAt?: string;
  sizeBytes?: number;
  contentType?: string;
  uploadToken: string;
  thumbnailUrl: string;
  thumbnailUrls?: ThumbnailUrls;
};

type UploadTemporaryRoomThumbnailResponse =
  ApiResponse<UploadTemporaryRoomThumbnailResult>;

export async function uploadTemporaryRoomThumbnail({
  file,
}: UploadTemporaryRoomThumbnailParams): Promise<UploadTemporaryRoomThumbnailResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response =
    await axiosInstance.post<UploadTemporaryRoomThumbnailResponse>(
      "/api/v2/rooms/thumbnail",
      formData,
    );

  const result = unwrapApiResponse(response.data);

  if (!result.uploadToken) {
    throw new ApiError({
      message: "썸네일 업로드 응답이 올바르지 않습니다.",
      status: 500,
    });
  }

  return result;
}
