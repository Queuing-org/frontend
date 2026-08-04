import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import type {
  MusicPowerResponse,
  MusicPowerVote,
} from "../model/types";

export type SetMusicPowerVoteParams = {
  userSlug: string;
  vote: MusicPowerVote;
};

export async function setMusicPowerVote({
  userSlug,
  vote,
}: SetMusicPowerVoteParams): Promise<MusicPowerResponse> {
  const { data } = await axiosInstance.put<ApiResponse<MusicPowerResponse>>(
    `/api/v1/user-profiles/${encodeURIComponent(userSlug)}/music-power`,
    { vote },
  );

  return unwrapApiResponse(data);
}
