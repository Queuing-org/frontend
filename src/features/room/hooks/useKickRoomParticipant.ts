"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  kickRoomParticipant,
  type KickRoomParticipantParams,
} from "../api/kickRoomParticipant";
import type { ApiError } from "@/src/shared/api/api-error";
import { playlistKeys } from "@/src/features/playlist/model/queryKeys";
import { roomKeys } from "../model/queryKeys";
import { scheduleQueryInvalidation } from "@/src/shared/api/query/scheduleQueryInvalidation";
import { getRoomReadInvalidationScope } from "../model/roomReadInvalidationScope";

export function useKickRoomParticipant() {
  const queryClient = useQueryClient();

  return useMutation<boolean, ApiError, KickRoomParticipantParams>({
    mutationFn: kickRoomParticipant,
    onSuccess: (_result, variables) => {
      scheduleQueryInvalidation({
        queryClient,
        queryKeys: [
          playlistKeys.roomParticipantsPrefix(variables.slug),
          roomKeys.meta(variables.slug),
        ],
        scopeKey: getRoomReadInvalidationScope(variables.slug),
      });
    },
  });
}
