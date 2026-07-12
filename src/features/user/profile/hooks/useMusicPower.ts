"use client";

import { useQuery } from "@tanstack/react-query";
import { userKeys } from "@/src/features/user/model/queryKeys";
import type { ApiError } from "@/src/shared/api/api-error";
import { fetchMusicPower } from "../api/fetchMusicPower";
import type { MusicPowerResponse } from "../model/types";

export function useMusicPower(userSlug: string | null | undefined) {
  return useQuery<MusicPowerResponse, ApiError>({
    queryKey: userKeys.musicPower(userSlug),
    queryFn: () => fetchMusicPower(userSlug!),
    enabled: Boolean(userSlug),
    retry: false,
  });
}
