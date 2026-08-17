import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import { buildRoomAccessTokenHeaders } from "@/src/shared/api/roomAccessTokenHeaders";
import type {
  MusicPowerPlaybackScope,
  MusicPowerResponse,
} from "../model/types";

export async function fetchMusicPower(
  userSlug: string,
  playbackScope?: MusicPowerPlaybackScope,
  signal?: AbortSignal,
  roomAccessToken?: string,
): Promise<MusicPowerResponse> {
  const accessTokenHeaders = buildRoomAccessTokenHeaders(roomAccessToken);
  const { data } = await axiosInstance.get<ApiResponse<MusicPowerResponse>>(
    `/api/v1/user-profiles/${encodeURIComponent(userSlug)}/music-power`,
    {
      ...(playbackScope ? { params: playbackScope } : {}),
      ...(accessTokenHeaders ? { headers: accessTokenHeaders } : {}),
      signal,
    },
  );

  return unwrapApiResponse(data);
}
