"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { fetchRoomQueue } from "../api/fetchRoomQueue";
import type { RoomQueueResult } from "./types";
import { playlistKeys } from "./queryKeys";

export function useRoomQueue(
  slug: string,
  password?: string | null,
) {
  return useSuspenseQuery<RoomQueueResult, ApiError>({
    queryKey: playlistKeys.roomQueue(slug, password, false),
    queryFn: () =>
      fetchRoomQueue({
        slug,
        password,
        mine: false,
      }),
  });
}
