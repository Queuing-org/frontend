import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import type { MusicPowerResponse } from "../model/types";

export async function fetchMusicPower(
  userSlug: string,
): Promise<MusicPowerResponse> {
  const { data } = await axiosInstance.get<ApiResponse<MusicPowerResponse>>(
    `/api/v1/user-profiles/${encodeURIComponent(userSlug)}/music-power`,
  );

  return unwrapApiResponse(data);
}
