"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { moveMyQueueEntry } from "../api/moveMyQueueEntry";
import type { MoveMyQueueEntryParams, RoomQueueResult } from "./types";
import type { ApiError } from "@/src/shared/api/api-error";
import {
  applyPendingEntryOrder,
  type QueueOrderSnapshot,
} from "./queueOrderOptimistic";
import { playlistKeys } from "./queryKeys";

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
        queryClient.getQueriesData<RoomQueueResult>({
          queryKey: playlistKeys.roomQueuePrefix(slug),
        });

      queryClient.setQueriesData<RoomQueueResult>(
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
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: playlistKeys.roomQueuePrefix(variables.slug),
      });
      await queryClient.invalidateQueries({
        queryKey: playlistKeys.roomStatePrefix(variables.slug),
      });
    },
  });
}
