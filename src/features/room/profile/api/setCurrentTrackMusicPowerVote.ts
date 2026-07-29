import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { buildRoomPasswordHeaders } from "@/src/shared/api/roomPasswordHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type {
  MusicPowerResponse,
  MusicPowerVote,
} from "@/src/features/user/profile/model/types";

export type SetCurrentTrackMusicPowerVoteParams = {
  roomSlug: string;
  password?: string | null;
  vote: MusicPowerVote;
};

export async function setCurrentTrackMusicPowerVote({
  roomSlug,
  password,
  vote,
}: SetCurrentTrackMusicPowerVoteParams): Promise<MusicPowerResponse> {
  const { data } = await axiosInstance.put<ApiResponse<MusicPowerResponse>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(roomSlug))}/current-track/music-power`,
    { vote },
    { headers: buildRoomPasswordHeaders(password) },
  );

  return unwrapApiResponse(data);
}
