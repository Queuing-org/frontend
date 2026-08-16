import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import type {
  MusicPowerResponse,
  MusicPowerVote,
} from "@/src/features/user/profile/model/types";

export type SetCurrentTrackMusicPowerVoteParams = {
  entryId: string;
  roomSlug: string;
  targetUserSlug: string;
  vote: MusicPowerVote;
};

export async function setCurrentTrackMusicPowerVote({
  entryId,
  roomSlug,
  targetUserSlug,
  vote,
}: SetCurrentTrackMusicPowerVoteParams): Promise<MusicPowerResponse> {
  const { data } = await axiosInstance.put<ApiResponse<MusicPowerResponse>>(
    `/api/v1/user-profiles/${encodeURIComponent(targetUserSlug)}/music-power`,
    { entryId, roomSlug, vote },
  );

  return unwrapApiResponse(data);
}
