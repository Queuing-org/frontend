"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRoom } from "@/src/features/room/api/deleteRoom";
import type {
  DeleteRoomParams,
  DeleteRoomResult,
} from "@/src/features/room/api/types";
import { roomKeys } from "@/src/features/room/model/queryKeys";
import { playlistKeys } from "@/src/features/playlist/model/queryKeys";
import type { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation<DeleteRoomResult, ApiError, DeleteRoomParams>({
    mutationKey: roomKeys.delete(),
    mutationFn: deleteRoom,
    onSuccess: async (_result, variables) => {
      const slug = normalizeRoomSlug(variables.slug);
      const roomQueryKeys = [
        roomKeys.meta(slug),
        playlistKeys.roomPlaybackPrefix(slug),
        playlistKeys.roomQueuePrefix(slug),
        playlistKeys.roomParticipantsPrefix(slug),
      ];

      await Promise.all(
        roomQueryKeys.map((queryKey) =>
          queryClient.cancelQueries({ queryKey }),
        ),
      );
      roomQueryKeys.forEach((queryKey) => {
        queryClient.removeQueries({ queryKey });
      });
      await queryClient.invalidateQueries({ queryKey: roomKeys.all() });
    },
  });
}
