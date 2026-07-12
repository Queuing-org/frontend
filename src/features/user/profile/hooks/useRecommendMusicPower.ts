"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/src/features/user/model/queryKeys";
import type { ApiError } from "@/src/shared/api/api-error";
import { recommendMusicPower } from "../api/recommendMusicPower";
import type { MusicPowerResponse, UserProfile } from "../model/types";

export function useRecommendMusicPower() {
  const queryClient = useQueryClient();

  return useMutation<MusicPowerResponse, ApiError, string>({
    mutationKey: [...userKeys.musicPowerRoot(), "recommend"],
    mutationFn: recommendMusicPower,
    onSuccess: (musicPower) => {
      queryClient.setQueryData(
        userKeys.musicPower(musicPower.targetUserSlug),
        musicPower,
      );
      queryClient.setQueryData<UserProfile>(
        userKeys.profile(musicPower.targetUserSlug),
        (profile) =>
          profile
            ? { ...profile, musicPower: musicPower.musicPower }
            : profile,
      );
      void queryClient.invalidateQueries({
        queryKey: userKeys.profile(musicPower.targetUserSlug),
      });
    },
  });
}
