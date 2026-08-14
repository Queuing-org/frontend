"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import type {
  MusicPowerResponse,
  MusicPowerVote,
} from "@/src/features/user/profile/model/types";
import { syncMusicPowerCaches } from "@/src/features/user/profile/model/syncMusicPowerCaches";
import { setCurrentTrackMusicPowerVote } from "../api/setCurrentTrackMusicPowerVote";

type CurrentTrackVoteVariables = {
  targetUserSlug: string;
  vote: MusicPowerVote;
};

export function useCurrentTrackMusicPowerVote() {
  const queryClient = useQueryClient();

  return useMutation<MusicPowerResponse, ApiError, CurrentTrackVoteVariables>({
    mutationFn: ({ targetUserSlug, vote }) =>
      setCurrentTrackMusicPowerVote({ targetUserSlug, vote }),
    onSuccess: (musicPower) => {
      syncMusicPowerCaches(queryClient, musicPower);
    },
  });
}
