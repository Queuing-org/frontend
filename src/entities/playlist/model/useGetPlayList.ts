"use client";

import { useQuery } from "@tanstack/react-query";
import { getPlaylist } from "../api/getPlaylist";
import type { PlaylistResult } from "./types";
import type { ApiError } from "@/src/shared/api/api-error";

export function useGetPlayList(slug: string | null, enabled = true) {
  return useQuery<PlaylistResult, ApiError>({
    queryKey: ["playlist", slug],
    queryFn: () => getPlaylist({ slug: slug! }),
    enabled: enabled && !!slug,
    retry: false,
  });
}
