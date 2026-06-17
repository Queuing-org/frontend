"use client";

import {
  useSuspenseInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import { fetchRooms } from "../api/fetchRooms";
import type { Room, RoomsResponse } from "../model/types";
import type { ApiError } from "@/src/shared/api/api-error";
import { roomKeys } from "../model/queryKeys";

const ROOMS_PAGE_SIZE = 30;
const ROOMS_QUERY_KEY = roomKeys.all();

export function getRoomsFromPages(data?: InfiniteData<RoomsResponse>): Room[] {
  const seenRoomIds = new Set<number>();

  return (
    data?.pages.flatMap((page) =>
      page.rooms.filter((room) => {
        if (seenRoomIds.has(room.id)) {
          return false;
        }

        seenRoomIds.add(room.id);
        return true;
      }),
    ) ?? []
  );
}

export function useRoomsQuery() {
  return useSuspenseInfiniteQuery<
    RoomsResponse,
    ApiError,
    InfiniteData<RoomsResponse>,
    typeof ROOMS_QUERY_KEY,
    number | undefined
  >({
    queryKey: ROOMS_QUERY_KEY,
    queryFn: ({ pageParam }) =>
      fetchRooms({ lastId: pageParam, size: ROOMS_PAGE_SIZE }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasNext) {
        return undefined;
      }

      return lastPage.rooms.at(-1)?.id;
    },
    retry: false,
  });
}
