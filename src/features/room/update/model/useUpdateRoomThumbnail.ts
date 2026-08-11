"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRoomThumbnail } from "@/src/features/room/api/updateRoomThumbnail";
import type {
  UpdateRoomThumbnailParams,
  UpdateRoomThumbnailResult,
} from "@/src/features/room/api/types";
import type { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import { roomKeys } from "@/src/features/room/model/queryKeys";

export function useUpdateRoomThumbnail() {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateRoomThumbnailResult,
    ApiError,
    UpdateRoomThumbnailParams
  >({
    mutationFn: updateRoomThumbnail,
    onSuccess: async (_result, variables) => {
      const slug = normalizeRoomSlug(variables.slug);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: roomKeys.all() }),
        queryClient.invalidateQueries({ queryKey: roomKeys.meta(slug) }),
      ]);
    },
  });
}
