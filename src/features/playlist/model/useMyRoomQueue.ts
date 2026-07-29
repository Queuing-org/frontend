"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { fetchRoomQueue } from "../api/fetchRoomQueue";
import type { RoomQueueResult } from "./types";
import { playlistKeys } from "./queryKeys";

export function useMyRoomQueue(
  slug: string,
  password?: string | null,
  enabled = true,
) {
  return useQuery<RoomQueueResult, ApiError>({
    queryKey: playlistKeys.roomQueue(slug, password, true),
    queryFn: () => fetchRoomQueue({ slug, password, mine: true }),
    enabled,
    retry: false,
  });
}
