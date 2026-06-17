"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { fetchRoomQueue } from "../api/fetchRoomQueue";
import type { RoomQueueResult } from "./types";
import { playlistKeys } from "./queryKeys";

export function useRoomQueue(
  slug: string,
  password?: string | null,
  offset = 0,
  size = 100,
) {
  return useSuspenseQuery<RoomQueueResult, ApiError>({
    queryKey: playlistKeys.roomQueue(slug, password, offset, size),
    queryFn: () =>
      fetchRoomQueue({
        slug,
        password,
        offset,
        size,
      }),
    retry: false,
  });
}
