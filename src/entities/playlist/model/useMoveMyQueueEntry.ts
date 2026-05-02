"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { moveMyQueueEntry } from "../api/moveMyQueueEntry";
import type {
  MoveMyQueueEntryParams,
  RoomQueueResult,
} from "./types";
import type { ApiError } from "@/src/shared/api/api-error";

type MoveMyQueueEntryVariables = MoveMyQueueEntryParams & {
  orderedPendingEntryIds: string[];
};

type RoomQueueSnapshot = [readonly unknown[], RoomQueueResult | undefined];

function applyPendingEntryOrder(
  currentEntries: RoomQueueResult | undefined,
  orderedPendingEntryIds: string[],
) {
  if (!currentEntries || orderedPendingEntryIds.length < 2) {
    return currentEntries;
  }

  const orderedEntriesById = new Map(
    currentEntries
      .filter((entry) => orderedPendingEntryIds.includes(entry.entryId))
      .map((entry) => [entry.entryId, entry]),
  );
  const reorderedEntries = orderedPendingEntryIds
    .map((entryId) => orderedEntriesById.get(entryId))
    .filter((entry) => !!entry);

  if (reorderedEntries.length !== orderedPendingEntryIds.length) {
    return currentEntries;
  }

  let reorderedIndex = 0;

  return currentEntries.map((entry) => {
    if (!orderedEntriesById.has(entry.entryId)) {
      return entry;
    }

    const reorderedEntry = reorderedEntries[reorderedIndex];
    reorderedIndex += 1;

    return reorderedEntry ?? entry;
  });
}

export function useMoveMyQueueEntry() {
  const queryClient = useQueryClient();

  return useMutation<boolean, ApiError, MoveMyQueueEntryVariables, {
    previousRoomQueueSnapshots: RoomQueueSnapshot[];
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
