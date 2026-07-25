"use client";

import { useMutation } from "@tanstack/react-query";
import {
  uploadTemporaryRoomThumbnail,
  type UploadTemporaryRoomThumbnailParams,
  type UploadTemporaryRoomThumbnailResult,
} from "@/src/features/room/api/uploadTemporaryRoomThumbnail";
import type { ApiError } from "@/src/shared/api/api-error";

export function useUploadTemporaryRoomThumbnail() {
  return useMutation<
    UploadTemporaryRoomThumbnailResult,
    ApiError,
    UploadTemporaryRoomThumbnailParams
  >({
    mutationFn: uploadTemporaryRoomThumbnail,
  });
}
