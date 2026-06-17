"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { fetchRoomPlayback } from "../api/fetchRoomPlayback";
import type { PlaybackSnapshot } from "./types";

export function useRoomPlayback(
  slug: string | null,
  password?: string | null,
  enabled = true,
) {
  return useQuery<PlaybackSnapshot | null, ApiError>({
    queryKey: ["roomPlayback", slug, password ?? null],
    queryFn: () => fetchRoomPlayback({ slug: slug!, password }),
    enabled: enabled && !!slug,
    retry: false,
  });
}
