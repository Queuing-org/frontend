import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type {
  PlaybackSnapshot,
  PlaylistProtectedRequestParams,
} from "../model/types";

export async function fetchRoomPlayback({
  slug,
  password,
}: PlaylistProtectedRequestParams): Promise<PlaybackSnapshot | null> {
  const res = await axiosInstance.get<ApiResponse<PlaybackSnapshot | null>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}/playback`,
    {
      headers: password
        ? {
            "X-Room-Password": password,
          }
        : undefined,
    },
  );

  return res.data.result;
}
