"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { moveMyQueueEntry } from "../api/moveMyQueueEntry";
import type { MoveMyQueueEntryParams } from "./types";
import type { ApiError } from "@/src/shared/api/api-error";
import {
  applyPendingEntryOrder,
  type QueueOrderSnapshot,
  type RoomQueueData,
} from "./queueOrderOptimistic";
import { playlistKeys } from "./queryKeys";
import { scheduleQueryInvalidation } from "@/src/shared/api/query/scheduleQueryInvalidation";
import { getRoomReadInvalidationScope } from "@/src/features/room/model/roomReadInvalidationScope";

type MoveMyQueueEntryVariables = MoveMyQueueEntryParams & {
  orderedPendingEntryIds: string[];
};

export function useMoveMyQueueEntry() {
  const queryClient = useQueryClient();

  return useMutation<boolean, ApiError, MoveMyQueueEntryVariables, {
    previousRoomQueueSnapshots: QueueOrderSnapshot[];
  }>({
    mutationFn: ({ beforeEntryId, movedEntryId, password, slug }) =>
      moveMyQueueEntry({
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
        queryKeys: [playlistKeys.roomPlaybackPrefix(variables.slug)],
        resetQueryKeys: [playlistKeys.roomQueuePrefix(variables.slug)],
        scopeKey: getRoomReadInvalidationScope(variables.slug),
      });
    },
  });
}
