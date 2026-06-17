import { axiosInstance } from "@/src/shared/api/axiosInstance";
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
      headers: password
        ? {
            "X-Room-Password": password,
          }
        : undefined,
    },
  );

  return res.data.result;
}
