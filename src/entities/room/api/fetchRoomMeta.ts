import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";
import type { RoomMeta } from "../model/types";
import { normalizeRoomSlug } from "./normalizeRoomSlug";

export async function fetchRoomMeta(slug: string): Promise<RoomMeta> {
  const res = await axiosInstance.get<ApiResponse<RoomMeta>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}`
  );

  return res.data.result;
}
