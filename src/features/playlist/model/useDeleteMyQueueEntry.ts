"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMyQueueEntry } from "../api/deleteMyQueueEntry";
import type { DeleteMyQueueEntryParams } from "./types";
import type { ApiError } from "@/src/shared/api/api-error";
import {
  removeQueueEntries,
  type RoomQueueData,
} from "./queueOrderOptimistic";
import { playlistKeys } from "./queryKeys";

type RoomQueueSnapshot = [readonly unknown[], RoomQueueData | undefined];

export function useDeleteMyQueueEntry() {
  const queryClient = useQueryClient();

  return useMutation<boolean, ApiError, DeleteMyQueueEntryParams, {
    previousRoomQueueSnapshots: RoomQueueSnapshot[];
  }>({
    mutationFn: deleteMyQueueEntry,
    onMutate: async ({ entryId, slug }) => {
      await queryClient.cancelQueries({
        queryKey: playlistKeys.roomQueuePrefix(slug),
      });

      const previousRoomQueueSnapshots =
        queryClient.getQueriesData<RoomQueueData>({
          queryKey: playlistKeys.roomQueuePrefix(slug),
        });

      queryClient.setQueriesData<RoomQueueData>(
        { queryKey: playlistKeys.roomQueuePrefix(slug) },
        (currentData) => removeQueueEntries(currentData, new Set([entryId])),
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
      await queryClient.resetQueries({
        queryKey: playlistKeys.roomQueuePrefix(variables.slug),
      });
      await queryClient.invalidateQueries({
        queryKey: playlistKeys.roomPlaybackPrefix(variables.slug),
      });
    },
  });
}
