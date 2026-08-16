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
  entryId: string;
  roomSlug: string;
  targetUserSlug: string;
  vote: MusicPowerVote;
};

export function useCurrentTrackMusicPowerVote() {
  const queryClient = useQueryClient();

  return useMutation<MusicPowerResponse, ApiError, CurrentTrackVoteVariables>({
    mutationFn: ({ entryId, roomSlug, targetUserSlug, vote }) =>
      setCurrentTrackMusicPowerVote({
        entryId,
        roomSlug,
        targetUserSlug,
        vote,
      }),
    onSuccess: (musicPower, { entryId, roomSlug }) => {
      syncMusicPowerCaches(queryClient, musicPower, { entryId, roomSlug });
    },
  });
}
