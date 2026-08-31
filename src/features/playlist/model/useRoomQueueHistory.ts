"use client";

import { useMemo } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import {
  fetchRoomQueueHistoryPage,
  getNextRoomQueueHistoryPageParam,
} from "../api/fetchRoomQueueHistory";
import type {
  RoomQueueHistoryEntry,
  RoomQueueHistoryPage,
  RoomQueueHistoryPageParam,
} from "./types";
import { playlistKeys } from "./queryKeys";

export const ROOM_QUEUE_HISTORY_MAX_PAGES = 5;

export function getChronologicalRoomQueueHistoryEntries(
  pages: RoomQueueHistoryPage[],
) {
  const newestEntryById = new Map<number, RoomQueueHistoryEntry>();

  for (const page of pages) {
    for (const entry of page.items) {
      if (!newestEntryById.has(entry.id)) {
        newestEntryById.set(entry.id, entry);
      }
    }
  }

  return Array.from(newestEntryById.values()).reverse();
}

export function includesLatestRoomQueueHistoryPage(
  data:
    | InfiniteData<
        RoomQueueHistoryPage,
        RoomQueueHistoryPageParam | null
      >
    | undefined,
) {
  return data?.pageParams[0] === null;
}

export function useRoomQueueHistory(
  slug: string,
  accessToken: string,
  enabled = true,
) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => playlistKeys.roomQueueHistory(slug),
    [slug],
  );
  const query = useInfiniteQuery<
    RoomQueueHistoryPage,
    ApiError,
    InfiniteData<
      RoomQueueHistoryPage,
      RoomQueueHistoryPageParam | null
    >,
    ReturnType<typeof playlistKeys.roomQueueHistory>,
    RoomQueueHistoryPageParam | null
  >({
    queryKey,
    queryFn: ({ pageParam, signal }) =>
      fetchRoomQueueHistoryPage({
        slug,
        accessToken,
        cursorId: pageParam,
        signal,
      }),
    initialPageParam: null,
    getNextPageParam: getNextRoomQueueHistoryPageParam,
    maxPages: ROOM_QUEUE_HISTORY_MAX_PAGES,
    enabled,
  });
  const entries = useMemo(
    () =>
      getChronologicalRoomQueueHistoryEntries(query.data?.pages ?? []),
    [query.data?.pages],
  );

  return {
    ...query,
    entries,
    includesLatestPage: includesLatestRoomQueueHistoryPage(query.data),
    resetToLatestPage: () =>
      queryClient.resetQueries({ queryKey, exact: true }),
  };
}
