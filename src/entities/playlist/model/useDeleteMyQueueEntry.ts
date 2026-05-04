"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMyQueueEntry } from "../api/deleteMyQueueEntry";
import type {
  DeleteMyQueueEntryParams,
  RoomQueueResult,
} from "./types";
import type { ApiError } from "@/src/shared/api/api-error";

type RoomQueueSnapshot = [readonly unknown[], RoomQueueResult | undefined];

export function useDeleteMyQueueEntry() {
  const queryClient = useQueryClient();

  return useMutation<boolean, ApiError, DeleteMyQueueEntryParams, {
    previousRoomQueueSnapshots: RoomQueueSnapshot[];
  }>({
    mutationFn: deleteMyQueueEntry,
    onMutate: async ({ entryId, slug }) => {
      await queryClient.cancelQueries({ queryKey: ["roomQueue", slug] });

      const previousRoomQueueSnapshots =
        queryClient.getQueriesData<RoomQueueResult>({
          queryKey: ["roomQueue", slug],
        });

      queryClient.setQueriesData<RoomQueueResult>(
        { queryKey: ["roomQueue", slug] },
        (currentEntries) =>
          currentEntries?.filter((entry) => entry.entryId !== entryId),
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
