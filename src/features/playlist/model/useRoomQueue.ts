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

export function useRoomQueue(
  slug: string,
  accessToken: string,
) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => playlistKeys.roomQueue(slug, false),
    [slug],
  );
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) =>
      fetchRoomQueuePage({
        slug,
        accessToken,
        cursor: pageParam,
        mine: false,
        signal,
      }),
    initialPageParam: null as RoomQueuePageParam | null,
    getNextPageParam: getNextRoomQueuePageParam,
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
