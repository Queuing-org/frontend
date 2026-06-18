"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  uploadRoomThumbnail,
  type UploadRoomThumbnailParams,
  type UploadRoomThumbnailResult,
} from "@/src/features/room/api/uploadRoomThumbnail";
import type { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import { roomKeys } from "@/src/features/room/model/queryKeys";

export function useUploadRoomThumbnail() {
  const queryClient = useQueryClient();

  return useMutation<
    UploadRoomThumbnailResult,
    ApiError,
    UploadRoomThumbnailParams
  >({
    mutationFn: uploadRoomThumbnail,
    onSuccess: async (_result, variables) => {
      const slug = normalizeRoomSlug(variables.slug);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: roomKeys.all() }),
        queryClient.invalidateQueries({ queryKey: roomKeys.meta(slug) }),
      ]);
    },
  });
}
