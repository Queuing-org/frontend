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

const ROOMS_PAGE_SIZE = 30;
const DEFAULT_ROOMS_QUERY_PARAMS: RoomListQueryParams = {
  createdOrder: "RANDOM",
  participantOrder: "RANDOM",
};

export type RoomsQueryParams = Partial<RoomListQueryParams>;

type RoomsPageParam =
  | {
      type: "legacy";
      lastId: number;
    }
  | {
      type: "cursor";
      cursorLastCreatedAt?: string;
      cursorLastId?: number;
      cursorLastParticipantCount?: number;
      cursorLastRandomRank?: number;
      cursorSeed?: number | string;
    }
  | undefined;

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

export function normalizeRoomsQueryParams(
  params: RoomsQueryParams = {},
): RoomListQueryParams {
  const trimmedKeyword = params.keyword?.trim();

  return {
    createdOrder:
      params.createdOrder ?? DEFAULT_ROOMS_QUERY_PARAMS.createdOrder,
    participantOrder:
      params.participantOrder ?? DEFAULT_ROOMS_QUERY_PARAMS.participantOrder,
    ...(trimmedKeyword ? { keyword: trimmedKeyword } : {}),
  };
}

function isLegacyPaginationMode(params: RoomListQueryParams) {
  return params.createdOrder === "NEW" && params.participantOrder === "RANDOM";
}

function hasCursorValue(value: unknown): value is number | string {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return typeof value === "string" && value.length > 0;
}

function getCursorPageParam(lastPage: RoomsResponse): RoomsPageParam {
  const cursorPageParam = {
    type: "cursor" as const,
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

  return Object.keys(cursorPageParam).length > 1
    ? cursorPageParam
    : undefined;
}

function getNextRoomsPageParam(
  lastPage: RoomsResponse,
  params: RoomListQueryParams,
): RoomsPageParam {
  if (!lastPage.hasNext) {
    return undefined;
  }

  if (isLegacyPaginationMode(params)) {
    const lastRoomId = lastPage.rooms.at(-1)?.id;

    return typeof lastRoomId === "number"
      ? { type: "legacy", lastId: lastRoomId }
      : undefined;
  }

  return getCursorPageParam(lastPage);
}

function getPageFetchParams(pageParam: RoomsPageParam): FetchRoomsParams {
  if (!pageParam) {
    return {};
  }

  if (pageParam.type === "legacy") {
    return {
      lastId: pageParam.lastId,
    };
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
    queryKey,
    queryFn: ({ pageParam }) =>
      fetchRooms({
        ...normalizedParams,
        ...getPageFetchParams(pageParam),
        size: ROOMS_PAGE_SIZE,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      getNextRoomsPageParam(lastPage, normalizedParams),
    retry: false,
  });
}
