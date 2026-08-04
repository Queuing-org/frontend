"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import type {
  MusicPowerResponse,
  MusicPowerVote,
} from "@/src/features/user/profile/model/types";
import { syncMusicPowerCaches } from "@/src/features/user/profile/model/syncMusicPowerCaches";
import { cancelCurrentTrackMusicPowerVote } from "../api/cancelCurrentTrackMusicPowerVote";
import { setCurrentTrackMusicPowerVote } from "../api/setCurrentTrackMusicPowerVote";

type CurrentTrackVoteVariables = {
  roomSlug: string;
  password?: string | null;
  vote: MusicPowerVote | null;
};

export function useCurrentTrackMusicPowerVote() {
  const queryClient = useQueryClient();

  return useMutation<MusicPowerResponse, ApiError, CurrentTrackVoteVariables>({
    mutationFn: ({ roomSlug, password, vote }) =>
      vote
        ? setCurrentTrackMusicPowerVote({ roomSlug, password, vote })
        : cancelCurrentTrackMusicPowerVote({ roomSlug, password }),
    onSuccess: (musicPower) => {
      syncMusicPowerCaches(queryClient, musicPower);
    },
  });
}
