"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { moveRoomQueueEntry } from "../api/moveRoomQueueEntry";
import type { MoveRoomQueueEntryParams, RoomQueueResult } from "./types";
import type { ApiError } from "@/src/shared/api/api-error";
import {
  applyPendingEntryOrder,
  type QueueOrderSnapshot,
} from "./queueOrderOptimistic";

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
      await queryClient.cancelQueries({ queryKey: ["roomQueue", slug] });

      const previousRoomQueueSnapshots =
        queryClient.getQueriesData<RoomQueueResult>({
          queryKey: ["roomQueue", slug],
        });

      queryClient.setQueriesData<RoomQueueResult>(
        { queryKey: ["roomQueue", slug] },
        (currentEntries) =>
          applyPendingEntryOrder(currentEntries, orderedPendingEntryIds),
      );

      return { previousRoomQueueSnapshots };
    },
    onError: (_error, variables, context) => {
      context?.previousRoomQueueSnapshots.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, previousData);
      });

      queryClient.invalidateQueries({ queryKey: ["roomQueue", variables.slug] });
    },
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["roomQueue", variables.slug],
      });
      await queryClient.invalidateQueries({
        queryKey: ["roomState", variables.slug],
      });
    },
  });
}
