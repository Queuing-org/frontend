"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  kickRoomParticipant,
  type KickRoomParticipantParams,
} from "../api/kickRoomParticipant";
import type { ApiError } from "@/src/shared/api/api-error";

export function useKickRoomParticipant() {
  const queryClient = useQueryClient();

  return useMutation<boolean, ApiError, KickRoomParticipantParams>({
    mutationFn: kickRoomParticipant,
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["roomState", variables.slug],
      });
      await queryClient.invalidateQueries({
        queryKey: ["roomMeta", variables.slug],
      });
    },
  });
}
