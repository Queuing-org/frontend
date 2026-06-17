"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  kickRoomParticipant,
  type KickRoomParticipantParams,
} from "../api/kickRoomParticipant";
import type { ApiError } from "@/src/shared/api/api-error";
import { playlistKeys } from "@/src/features/playlist/model/queryKeys";
import { roomKeys } from "../model/queryKeys";

export function useKickRoomParticipant() {
  const queryClient = useQueryClient();

  return useMutation<boolean, ApiError, KickRoomParticipantParams>({
    mutationFn: kickRoomParticipant,
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: playlistKeys.roomStatePrefix(variables.slug),
      });
      await queryClient.invalidateQueries({
        queryKey: roomKeys.meta(variables.slug),
      });
    },
  });
}
