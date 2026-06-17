"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { fetchRoomQueue } from "../api/fetchRoomQueue";
import type { RoomQueueResult } from "./types";

export function useRoomQueue(
  slug: string | null,
  password?: string | null,
  offset = 0,
  size = 100,
  enabled = true,
) {
  return useQuery<RoomQueueResult, ApiError>({
    queryKey: ["roomQueue", slug, password ?? null, offset, size],
    queryFn: () =>
      fetchRoomQueue({
        slug: slug!,
        password,
        offset,
        size,
      }),
    enabled: enabled && !!slug,
    retry: false,
  });
}
