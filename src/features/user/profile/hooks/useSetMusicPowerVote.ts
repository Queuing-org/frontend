"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { setMusicPowerVote } from "../api/setMusicPowerVote";
import type { MusicPowerResponse } from "../model/types";
import { syncMusicPowerCaches } from "../model/syncMusicPowerCaches";

export function useSetMusicPowerVote() {
  const queryClient = useQueryClient();

  return useMutation<
    MusicPowerResponse,
    ApiError,
    Parameters<typeof setMusicPowerVote>[0]
  >({
    mutationFn: setMusicPowerVote,
    onSuccess: (musicPower) => {
      syncMusicPowerCaches(queryClient, musicPower);
    },
  });
}
