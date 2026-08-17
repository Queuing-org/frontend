"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRoomThumbnail } from "@/src/features/room/api/deleteRoomThumbnail";
import type {
  DeleteRoomThumbnailParams,
  DeleteRoomThumbnailResult,
} from "@/src/features/room/api/types";
import { roomKeys } from "@/src/features/room/model/queryKeys";
import type { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export function useDeleteRoomThumbnail() {
  const queryClient = useQueryClient();

  return useMutation<
    DeleteRoomThumbnailResult,
    ApiError,
    DeleteRoomThumbnailParams
  >({
    mutationFn: deleteRoomThumbnail,
    onSuccess: async (_result, variables) => {
      const slug = normalizeRoomSlug(variables.slug);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: roomKeys.all() }),
        queryClient.invalidateQueries({ queryKey: roomKeys.meta(slug) }),
      ]);
    },
  });
}
