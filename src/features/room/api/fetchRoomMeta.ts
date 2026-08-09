import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { RoomMeta } from "../model/types";

export async function fetchRoomMeta(
  slug: string,
  signal?: AbortSignal,
): Promise<RoomMeta> {
  const res = await axiosInstance.get<ApiResponse<RoomMeta>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}`,
    { signal },
  );

  return unwrapApiResponse(res.data);
}
