import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { buildRoomPasswordHeaders } from "@/src/shared/api/roomPasswordHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type {
  PlaylistProtectedRequestParams,
  RoomPlayback,
} from "../model/types";

export async function fetchRoomPlayback({
  slug,
  password,
}: PlaylistProtectedRequestParams): Promise<RoomPlayback> {
  const res = await axiosInstance.get<ApiResponse<RoomPlayback>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}/playback`,
    {
      headers: buildRoomPasswordHeaders(password),
    },
  );

  return unwrapApiResponse(res.data);
}
