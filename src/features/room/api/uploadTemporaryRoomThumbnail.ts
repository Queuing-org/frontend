import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import type { ThumbnailUrls } from "@/src/features/room/model/types";
import { ApiError } from "@/src/shared/api/api-error";

export type UploadTemporaryRoomThumbnailParams = {
  file: File;
};

export type UploadTemporaryRoomThumbnailResult = {
  uploadToken: string;
  thumbnailUrl: string;
  thumbnailUrls: ThumbnailUrls | null;
  contentType: string;
  sizeBytes: number;
  width: number;
  height: number;
  expiresAt: string;
};

type UploadTemporaryRoomThumbnailResponse =
  ApiResponse<UploadTemporaryRoomThumbnailResult>;

function isThumbnailUrls(value: unknown): value is ThumbnailUrls {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ThumbnailUrls>;
  return (
    typeof candidate.thumb256 === "string" &&
    typeof candidate.thumb384 === "string" &&
    typeof candidate.thumb640 === "string" &&
    typeof candidate.thumb828 === "string" &&
    typeof candidate.thumb1200 === "string"
  );
}

function isUploadResult(
  value: unknown,
): value is UploadTemporaryRoomThumbnailResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<UploadTemporaryRoomThumbnailResult>;
  return (
    typeof candidate.uploadToken === "string" &&
    Boolean(candidate.uploadToken) &&
    typeof candidate.thumbnailUrl === "string" &&
    (candidate.thumbnailUrls === null ||
      isThumbnailUrls(candidate.thumbnailUrls)) &&
    typeof candidate.contentType === "string" &&
    typeof candidate.sizeBytes === "number" &&
    typeof candidate.width === "number" &&
    typeof candidate.height === "number" &&
    typeof candidate.expiresAt === "string"
  );
}

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

  if (!isUploadResult(result)) {
    throw new ApiError({
      message: "썸네일 업로드 응답이 올바르지 않습니다.",
      status: 500,
    });
  }

  return result;
}
