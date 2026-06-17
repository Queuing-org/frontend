"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRoom } from "@/src/features/room/api/updateRoom";
import type {
  UpdateRoomParams,
  UpdateRoomResult,
} from "@/src/features/room/api/types";
import type { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import { roomKeys } from "@/src/features/room/model/queryKeys";

export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation<UpdateRoomResult, ApiError, UpdateRoomParams>({
    mutationFn: updateRoom,
    onSuccess: async (_result, variables) => {
      const slug = normalizeRoomSlug(variables.slug);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: roomKeys.all() }),
        queryClient.invalidateQueries({ queryKey: roomKeys.meta(slug) }),
      ]);
    },
  });
}
