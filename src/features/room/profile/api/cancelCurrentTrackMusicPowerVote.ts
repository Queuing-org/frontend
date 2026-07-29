import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { buildRoomPasswordHeaders } from "@/src/shared/api/roomPasswordHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { MusicPowerResponse } from "@/src/features/user/profile/model/types";

export type CancelCurrentTrackMusicPowerVoteParams = {
  roomSlug: string;
  password?: string | null;
};

export async function cancelCurrentTrackMusicPowerVote({
  roomSlug,
  password,
}: CancelCurrentTrackMusicPowerVoteParams): Promise<MusicPowerResponse> {
  const { data } = await axiosInstance.delete<ApiResponse<MusicPowerResponse>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(roomSlug))}/current-track/music-power`,
    { headers: buildRoomPasswordHeaders(password) },
  );

  return unwrapApiResponse(data);
}
