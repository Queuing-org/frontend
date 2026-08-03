"use client";

import { useEffect, useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError as ApiErrorValue } from "@/src/shared/api/api-error";
import {
  fetchRoomQueuePage,
  getNextRoomQueuePageParam,
  QUEUE_CONFLICT_CODE,
} from "../api/fetchRoomQueue";
import type { RoomQueuePageParam } from "./types";
import { playlistKeys } from "./queryKeys";

export function useMyRoomQueue(
  slug: string,
  password?: string | null,
  enabled = true,
) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => playlistKeys.roomQueue(slug, password, true),
    [password, slug],
  );
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      fetchRoomQueuePage({
        slug,
        password,
        cursor: pageParam?.cursor,
        queueRevision: pageParam?.queueRevision,
        mine: true,
      }),
    initialPageParam: null as RoomQueuePageParam | null,
    getNextPageParam: getNextRoomQueuePageParam,
    enabled,
  });

  useEffect(() => {
    if (
      !query.isFetchNextPageError &&
      query.error instanceof ApiErrorValue &&
      query.error.code === QUEUE_CONFLICT_CODE
    ) {
      void queryClient.resetQueries({ queryKey, exact: true });
    }
  }, [query.error, query.isFetchNextPageError, queryClient, queryKey]);

  return {
    ...query,
    fetchNextQueuePage: async () => {
      const result = await query.fetchNextPage();
      const error = result.error;
      if (error instanceof ApiErrorValue && error.code === QUEUE_CONFLICT_CODE) {
        await queryClient.resetQueries({ queryKey, exact: true });
      }
      return result;
    },
  };
}
