"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { moveRoomQueueEntry } from "../api/moveRoomQueueEntry";
import type { MoveRoomQueueEntryParams } from "./types";
import type { ApiError } from "@/src/shared/api/api-error";
import {
  applyPendingEntryOrder,
  type QueueOrderSnapshot,
  type RoomQueueData,
} from "./queueOrderOptimistic";
import { playlistKeys } from "./queryKeys";
import { scheduleQueryInvalidation } from "@/src/shared/api/query/scheduleQueryInvalidation";
import { getRoomReadInvalidationScope } from "@/src/features/room/model/roomReadInvalidationScope";

type MoveRoomQueueEntryVariables = MoveRoomQueueEntryParams & {
  orderedPendingEntryIds: string[];
};

export function useMoveRoomQueueEntry() {
  const queryClient = useQueryClient();

  return useMutation<boolean, ApiError, MoveRoomQueueEntryVariables, {
    previousRoomQueueSnapshots: QueueOrderSnapshot[];
  }>({
    mutationFn: ({ beforeEntryId, movedEntryId, password, slug }) =>
      moveRoomQueueEntry({
        beforeEntryId,
        movedEntryId,
        password,
        slug,
      }),
    onMutate: async ({ orderedPendingEntryIds, slug }) => {
      await queryClient.cancelQueries({
        queryKey: playlistKeys.roomQueuePrefix(slug),
      });

      const previousRoomQueueSnapshots =
        queryClient.getQueriesData<RoomQueueData>({
          queryKey: playlistKeys.roomQueuePrefix(slug),
        });

      queryClient.setQueriesData<RoomQueueData>(
        { queryKey: playlistKeys.roomQueuePrefix(slug) },
        (currentEntries) =>
          applyPendingEntryOrder(currentEntries, orderedPendingEntryIds),
      );

      return { previousRoomQueueSnapshots };
    },
    onError: (_error, variables, context) => {
      context?.previousRoomQueueSnapshots.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, previousData);
      });

      queryClient.invalidateQueries({
        queryKey: playlistKeys.roomQueuePrefix(variables.slug),
      });
    },
    onSuccess: (_result, variables) => {
      scheduleQueryInvalidation({
        queryClient,
        queryKeys: [
          playlistKeys.roomPlaybackPrefix(variables.slug),
        ],
        resetQueryKeys: [playlistKeys.roomQueuePrefix(variables.slug)],
        scopeKey: getRoomReadInvalidationScope(variables.slug),
      });
    },
  });
}
