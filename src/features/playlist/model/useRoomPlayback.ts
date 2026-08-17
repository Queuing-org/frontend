"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { fetchRoomPlayback } from "../api/fetchRoomPlayback";
import type { RoomPlayback } from "./types";
import { playlistKeys } from "./queryKeys";

export function useRoomPlayback(
  slug: string | null,
  accessToken: string | null,
  enabled = true,
) {
  return useQuery<RoomPlayback, ApiError>({
    queryKey: playlistKeys.roomPlayback(slug),
    queryFn: ({ signal }) =>
      fetchRoomPlayback({ slug: slug!, accessToken: accessToken!, signal }),
    enabled: enabled && !!slug && !!accessToken,
  });
}
