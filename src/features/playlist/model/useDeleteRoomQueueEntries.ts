"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRoomQueueEntries } from "../api/deleteRoomQueueEntries";
import type { DeleteRoomQueueEntriesParams } from "./types";
import type { ApiError } from "@/src/shared/api/api-error";
import {
  removeQueueEntries,
  type RoomQueueData,
} from "./queueOrderOptimistic";
import { playlistKeys } from "./queryKeys";
import { scheduleQueryInvalidation } from "@/src/shared/api/query/scheduleQueryInvalidation";
import { getRoomReadInvalidationScope } from "@/src/features/room/model/roomReadInvalidationScope";

type RoomQueueSnapshot = [readonly unknown[], RoomQueueData | undefined];

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
        queryClient.getQueriesData<RoomQueueData>({
          queryKey: playlistKeys.roomQueuePrefix(slug),
        });

      const entryIdSet = new Set(entryIds);
      queryClient.setQueriesData<RoomQueueData>(
        { queryKey: playlistKeys.roomQueuePrefix(slug) },
        (currentData) => removeQueueEntries(currentData, entryIdSet),
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
        queryKeys: [
          playlistKeys.roomPlaybackPrefix(variables.slug),
        ],
        resetQueryKeys: [playlistKeys.roomQueuePrefix(variables.slug)],
        scopeKey: getRoomReadInvalidationScope(variables.slug),
      });
    },
  });
}
