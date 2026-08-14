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
import { scheduleQueryInvalidation } from "@/src/shared/api/query/scheduleQueryInvalidation";
import { getRoomReadInvalidationScope } from "@/src/features/room/model/roomReadInvalidationScope";

type RoomQueueSnapshot = [readonly unknown[], RoomQueueData | undefined];

export function useDeleteMyQueueEntry() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, DeleteMyQueueEntryParams, {
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
