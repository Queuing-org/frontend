"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { fetchRoomHistory } from "../api/fetchRoomHistory";
import type { RoomHistoryPage } from "./types";
import { playlistKeys } from "./queryKeys";

export function useRoomHistory(
  slug: string,
  password?: string | null,
  enabled = true,
) {
  return useInfiniteQuery<
    RoomHistoryPage,
    ApiError,
    RoomHistoryPage[],
    ReturnType<typeof playlistKeys.roomHistory>,
    number | null
  >({
    queryKey: playlistKeys.roomHistory(slug, password),
    queryFn: ({ pageParam }) =>
      fetchRoomHistory({ slug, password, cursorId: pageParam, size: 100 }),
    initialPageParam: null,
    getNextPageParam: (page) =>
      page.hasNext ? page.nextCursor ?? undefined : undefined,
    enabled,
    select: (data) => data.pages,
    retry: false,
  });
}
