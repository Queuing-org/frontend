"use client";

import {
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import {
  fetchRoomParticipantsPage,
  getNextRoomParticipantsPageParam,
} from "../api/fetchRoomParticipants";
import type { RoomParticipantsPage } from "./types";
import { playlistKeys } from "./queryKeys";

export function useRoomParticipants(
  slug: string | null,
  password?: string | null,
  enabled = true,
) {
  const queryKey = playlistKeys.roomParticipants(slug, password);

  return useInfiniteQuery<
    RoomParticipantsPage,
    ApiError,
    InfiniteData<RoomParticipantsPage>,
    typeof queryKey,
    string | null
  >({
    queryKey,
    queryFn: ({ pageParam, signal }) =>
      fetchRoomParticipantsPage({
        slug: slug!,
        password,
        cursor: pageParam ?? undefined,
        signal,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: getNextRoomParticipantsPageParam,
    enabled: enabled && Boolean(slug),
  });
}
