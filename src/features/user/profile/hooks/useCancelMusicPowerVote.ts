"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { cancelMusicPowerVote } from "../api/cancelMusicPowerVote";
import type { MusicPowerResponse } from "../model/types";
import { syncMusicPowerCaches } from "../model/syncMusicPowerCaches";

export function useCancelMusicPowerVote() {
  const queryClient = useQueryClient();

  return useMutation<MusicPowerResponse, ApiError, string>({
    mutationFn: cancelMusicPowerVote,
    onSuccess: (musicPower) => {
      syncMusicPowerCaches(queryClient, musicPower);
    },
  });
}
