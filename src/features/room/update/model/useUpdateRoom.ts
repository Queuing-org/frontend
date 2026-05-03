"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRoom } from "@/src/entities/room/api/updateRoom";
import type {
  UpdateRoomParams,
  UpdateRoomResult,
} from "@/src/entities/room/api/types";
import type { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation<UpdateRoomResult, ApiError, UpdateRoomParams>({
    mutationFn: updateRoom,
    onSuccess: async (_result, variables) => {
      const slug = normalizeRoomSlug(variables.slug);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rooms"] }),
        queryClient.invalidateQueries({ queryKey: ["roomMeta", slug] }),
      ]);
    },
  });
}
