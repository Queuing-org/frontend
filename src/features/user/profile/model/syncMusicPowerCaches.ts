import type { QueryClient } from "@tanstack/react-query";
import { userKeys } from "@/src/features/user/model/queryKeys";
import type { User } from "@/src/features/user/model/types";
import type { MusicPowerResponse, UserProfile } from "./types";

export function syncMusicPowerCaches(
  queryClient: QueryClient,
  musicPower: MusicPowerResponse,
) {
  queryClient.setQueryData(
    userKeys.musicPower(musicPower.targetUserSlug),
    musicPower,
  );
  queryClient.setQueryData<UserProfile>(
    userKeys.profile(musicPower.targetUserSlug),
    (profile) =>
      profile ? { ...profile, musicPower: musicPower.musicPower } : profile,
  );
  queryClient.setQueryData<User | null>(userKeys.me(), (me) =>
    me?.slug === musicPower.targetUserSlug
      ? { ...me, musicPower: musicPower.musicPower }
      : me,
  );

  void queryClient.invalidateQueries({
    queryKey: userKeys.profile(musicPower.targetUserSlug),
  });
}
