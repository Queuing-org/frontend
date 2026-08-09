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

type RoomsPageParam =
  | {
      cursorLastCreatedAt?: string;
      cursorLastId?: number;
      cursorLastParticipantCount?: number;
      cursorLastRandomRank?: number;
      cursorSeed?: number | string;
    }
  | undefined;

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

function hasCursorValue(value: unknown): value is number | string {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return typeof value === "string" && value.length > 0;
}

function getCursorPageParam(lastPage: RoomsResponse): RoomsPageParam {
  const cursorPageParam = {
    ...(hasCursorValue(lastPage.nextCursorSeed)
      ? { cursorSeed: lastPage.nextCursorSeed }
      : {}),
    ...(typeof lastPage.nextCursorLastId === "number"
      ? { cursorLastId: lastPage.nextCursorLastId }
      : {}),
    ...(hasCursorValue(lastPage.nextCursorLastCreatedAt)
      ? { cursorLastCreatedAt: lastPage.nextCursorLastCreatedAt }
      : {}),
    ...(typeof lastPage.nextCursorLastRandomRank === "number"
      ? { cursorLastRandomRank: lastPage.nextCursorLastRandomRank }
      : {}),
    ...(typeof lastPage.nextCursorLastParticipantCount === "number"
      ? { cursorLastParticipantCount: lastPage.nextCursorLastParticipantCount }
      : {}),
  };

  return Object.keys(cursorPageParam).length > 0
    ? cursorPageParam
    : undefined;
}

function getNextRoomsPageParam(
  lastPage: RoomsResponse,
  _allPages: readonly RoomsResponse[],
  _lastPageParam: RoomsPageParam,
  allPageParams: readonly RoomsPageParam[],
): RoomsPageParam {
  if (!lastPage.hasNext) {
    return undefined;
  }

  const nextPageParam = getCursorPageParam(lastPage);
  if (!nextPageParam) {
    return undefined;
  }

  const cursorWasAlreadyRequested = allPageParams.some(
    (pageParam) =>
      pageParam != null && isSameRoomsPageParam(pageParam, nextPageParam),
  );

  return cursorWasAlreadyRequested ? undefined : nextPageParam;
}

function isSameRoomsPageParam(
  left: Exclude<RoomsPageParam, undefined>,
  right: Exclude<RoomsPageParam, undefined>,
) {
  return (
    left.cursorSeed === right.cursorSeed &&
    left.cursorLastId === right.cursorLastId &&
    left.cursorLastCreatedAt === right.cursorLastCreatedAt &&
    left.cursorLastRandomRank === right.cursorLastRandomRank &&
    left.cursorLastParticipantCount === right.cursorLastParticipantCount
  );
}

function getPageFetchParams(pageParam: RoomsPageParam): FetchRoomsParams {
  if (!pageParam) {
    return {};
  }

  return {
    cursorLastCreatedAt: pageParam.cursorLastCreatedAt,
    cursorLastId: pageParam.cursorLastId,
    cursorLastParticipantCount: pageParam.cursorLastParticipantCount,
    cursorLastRandomRank: pageParam.cursorLastRandomRank,
    cursorSeed: pageParam.cursorSeed,
  };
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
    initialPageParam: undefined,
    maxPages: ROOM_DISCOVERY_MAX_PAGES,
    getNextPageParam: getNextRoomsPageParam,
  });
}
