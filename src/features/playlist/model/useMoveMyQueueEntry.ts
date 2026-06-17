"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { moveMyQueueEntry } from "../api/moveMyQueueEntry";
import type { MoveMyQueueEntryParams, RoomQueueResult } from "./types";
import type { ApiError } from "@/src/shared/api/api-error";
import {
  applyPendingEntryOrder,
  type QueueOrderSnapshot,
} from "./queueOrderOptimistic";

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
