"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRoomQueueEntries } from "../api/deleteRoomQueueEntries";
import type {
  DeleteRoomQueueEntriesParams,
  RoomQueueResult,
} from "./types";
import type { ApiError } from "@/src/shared/api/api-error";

type RoomQueueSnapshot = [readonly unknown[], RoomQueueResult | undefined];

export function useDeleteRoomQueueEntries() {
  const queryClient = useQueryClient();

  return useMutation<boolean, ApiError, DeleteRoomQueueEntriesParams, {
    previousRoomQueueSnapshots: RoomQueueSnapshot[];
  }>({
    mutationFn: deleteRoomQueueEntries,
    onMutate: async ({ entryIds, slug }) => {
      await queryClient.cancelQueries({ queryKey: ["roomQueue", slug] });

      const previousRoomQueueSnapshots =
        queryClient.getQueriesData<RoomQueueResult>({
          queryKey: ["roomQueue", slug],
        });

      const entryIdSet = new Set(entryIds);
      queryClient.setQueriesData<RoomQueueResult>(
        { queryKey: ["roomQueue", slug] },
        (currentEntries) =>
          currentEntries?.filter((entry) => !entryIdSet.has(entry.entryId)),
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
