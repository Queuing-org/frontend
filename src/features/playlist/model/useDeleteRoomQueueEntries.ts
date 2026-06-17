"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRoomQueueEntries } from "../api/deleteRoomQueueEntries";
import type {
  DeleteRoomQueueEntriesParams,
  RoomQueueResult,
} from "./types";
import type { ApiError } from "@/src/shared/api/api-error";
import { playlistKeys } from "./queryKeys";

type RoomQueueSnapshot = [readonly unknown[], RoomQueueResult | undefined];

export function useDeleteRoomQueueEntries() {
  const queryClient = useQueryClient();

  return useMutation<boolean, ApiError, DeleteRoomQueueEntriesParams, {
    previousRoomQueueSnapshots: RoomQueueSnapshot[];
  }>({
    mutationFn: deleteRoomQueueEntries,
    onMutate: async ({ entryIds, slug }) => {
      await queryClient.cancelQueries({
        queryKey: playlistKeys.roomQueuePrefix(slug),
      });

      const previousRoomQueueSnapshots =
        queryClient.getQueriesData<RoomQueueResult>({
          queryKey: playlistKeys.roomQueuePrefix(slug),
        });

      const entryIdSet = new Set(entryIds);
      queryClient.setQueriesData<RoomQueueResult>(
        { queryKey: playlistKeys.roomQueuePrefix(slug) },
        (currentEntries) =>
          currentEntries?.filter((entry) => !entryIdSet.has(entry.entryId)),
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
