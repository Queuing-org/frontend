"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { fetchRoomPlayback } from "../api/fetchRoomPlayback";
import type { RoomPlayback } from "./types";
import { playlistKeys } from "./queryKeys";

export function useRoomPlayback(
  slug: string | null,
  password?: string | null,
  enabled = true,
) {
  return useQuery<RoomPlayback, ApiError>({
    queryKey: playlistKeys.roomPlayback(slug, password),
    queryFn: () => fetchRoomPlayback({ slug: slug!, password }),
    enabled: enabled && !!slug,
    retry: false,
  });
}
