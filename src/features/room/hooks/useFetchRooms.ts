"use client";

import {
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  fetchRooms,
  type FetchRoomsParams,
  type RoomListQueryParams,
} from "../api/fetchRooms";
import type { Room, RoomsResponse } from "../model/types";
import type { ApiError } from "@/src/shared/api/api-error";
import { roomKeys } from "../model/queryKeys";
import { ROOM_DISCOVERY_CACHE_POLICY } from "../model/roomDiscoveryCachePolicy";
import { normalizeRoomTagSlugs } from "../model/roomTagFilters";

const ROOMS_PAGE_SIZE = 30;
export const ROOM_DISCOVERY_MAX_PAGES = 3;
export const ROOM_DISCOVERY_MAX_ROOMS =
  ROOMS_PAGE_SIZE * ROOM_DISCOVERY_MAX_PAGES;
const DEFAULT_ROOMS_QUERY_PARAMS: RoomListQueryParams = {
  createdOrder: "RANDOM",
  participantOrder: "RANDOM",
};

export type RoomsQueryParams = Partial<RoomListQueryParams>;

type RoomsPageParam = string | null;

export function getRoomsFromPages(data?: InfiniteData<RoomsResponse>): Room[] {
  const seenRoomIds = new Set<number>();
  const rooms =
    data?.pages.flatMap((page) =>
      page.rooms.filter((room) => {
        if (seenRoomIds.has(room.id)) {
          return false;
        }

        seenRoomIds.add(room.id);
        return true;
      }),
    ) ?? [];

  return rooms.length > ROOM_DISCOVERY_MAX_ROOMS
    ? rooms.slice(-ROOM_DISCOVERY_MAX_ROOMS)
    : rooms;
}

export function normalizeRoomsQueryParams(
  params: RoomsQueryParams = {},
): RoomListQueryParams {
  const trimmedKeyword = params.keyword?.trim();
  const normalizedTags = normalizeRoomTagSlugs(params.tags);

  return {
    createdOrder:
      params.createdOrder ?? DEFAULT_ROOMS_QUERY_PARAMS.createdOrder,
    participantOrder:
      params.participantOrder ?? DEFAULT_ROOMS_QUERY_PARAMS.participantOrder,
    ...(trimmedKeyword ? { keyword: trimmedKeyword } : {}),
    ...(normalizedTags.length > 0 ? { tags: normalizedTags } : {}),
  };
}

function getNextRoomsPageParam(
  lastPage: RoomsResponse,
  _allPages: readonly RoomsResponse[],
  _lastPageParam: RoomsPageParam,
  allPageParams: readonly RoomsPageParam[],
): RoomsPageParam | undefined {
  if (!lastPage.hasNext) {
    return undefined;
  }

  const nextPageParam = lastPage.nextCursor?.trim() || undefined;
  if (!nextPageParam) {
    return undefined;
  }

  const cursorWasAlreadyRequested = allPageParams.includes(nextPageParam);

  return cursorWasAlreadyRequested ? undefined : nextPageParam;
}

function getPageFetchParams(pageParam: RoomsPageParam): FetchRoomsParams {
  if (!pageParam) {
    return {};
  }

  return { cursor: pageParam };
}

export function useRoomsQuery(params: RoomsQueryParams = {}) {
  const normalizedParams = normalizeRoomsQueryParams(params);
  const queryKey = roomKeys.list(normalizedParams);

  return useInfiniteQuery<
    RoomsResponse,
    ApiError,
    InfiniteData<RoomsResponse>,
    typeof queryKey,
    RoomsPageParam
  >({
    ...ROOM_DISCOVERY_CACHE_POLICY,
    queryKey,
    queryFn: ({ pageParam, signal }) =>
      fetchRooms(
        {
          ...normalizedParams,
          ...getPageFetchParams(pageParam),
          size: ROOMS_PAGE_SIZE,
        },
        signal,
      ),
    initialPageParam: null,
    maxPages: ROOM_DISCOVERY_MAX_PAGES,
    getNextPageParam: getNextRoomsPageParam,
  });
}
