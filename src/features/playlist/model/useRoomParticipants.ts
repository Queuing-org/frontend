"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { fetchRoomParticipants } from "../api/fetchRoomParticipants";
import type { PlaylistParticipant } from "./types";
import { playlistKeys } from "./queryKeys";

export function useRoomParticipants(
  slug: string | null,
  password?: string | null,
  enabled = true,
) {
  return useQuery<PlaylistParticipant[], ApiError>({
    queryKey: playlistKeys.roomParticipants(slug, password),
    queryFn: () => fetchRoomParticipants({ slug: slug!, password }),
    enabled: enabled && Boolean(slug),
    retry: false,
  });
}
