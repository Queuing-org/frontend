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
): RoomsPageParam {
  if (!lastPage.hasNext) {
    return undefined;
  }

  return getCursorPageParam(lastPage);
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
    queryKey,
    queryFn: ({ pageParam }) =>
      fetchRooms({
        ...normalizedParams,
        ...getPageFetchParams(pageParam),
        size: ROOMS_PAGE_SIZE,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      getNextRoomsPageParam(lastPage),
  });
}
