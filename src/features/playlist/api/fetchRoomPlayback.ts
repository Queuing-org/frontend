import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { buildRoomAccessTokenHeaders } from "@/src/shared/api/roomAccessTokenHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type {
  PlaylistProtectedRequestParams,
  RoomPlayback,
} from "../model/types";

type FetchRoomPlaybackParams = PlaylistProtectedRequestParams & {
  signal?: AbortSignal;
};

export async function fetchRoomPlayback({
  slug,
  accessToken,
  signal,
}: FetchRoomPlaybackParams): Promise<RoomPlayback> {
  const res = await axiosInstance.get<ApiResponse<RoomPlayback>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}/playback`,
    {
      headers: buildRoomAccessTokenHeaders(accessToken),
      signal,
    },
  );

  return unwrapApiResponse(res.data);
}
