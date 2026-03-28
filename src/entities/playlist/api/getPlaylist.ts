import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { GetPlaylistParams, PlaylistResult } from "../model/types";

export async function getPlaylist({
  slug,
}: GetPlaylistParams): Promise<PlaylistResult> {
  const res = await axiosInstance.get<ApiResponse<PlaylistResult>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}/playlist`,
  );

  return res.data.result;
}
