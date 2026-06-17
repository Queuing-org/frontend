import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { buildRoomPasswordHeaders } from "@/src/shared/api/roomPasswordHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type {
  PlaylistProtectedRequestParams,
  RoomStateSnapshot,
} from "../model/types";

export async function fetchRoomState({
  slug,
  password,
}: PlaylistProtectedRequestParams): Promise<RoomStateSnapshot> {
  const res = await axiosInstance.get<ApiResponse<RoomStateSnapshot>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}/state`,
    {
      headers: buildRoomPasswordHeaders(password),
    },
  );

  return unwrapApiResponse(res.data);
}
