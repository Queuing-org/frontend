import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { RoomQueueRequestParams, RoomQueueResult } from "../model/types";

export async function fetchRoomQueue({
  slug,
  password,
  offset = 0,
  size = 100,
}: RoomQueueRequestParams): Promise<RoomQueueResult> {
  const res = await axiosInstance.get<ApiResponse<RoomQueueResult>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}/playlist`,
    {
      params: {
        offset,
        size,
      },
      headers: password
        ? {
            "X-Room-Password": password,
          }
        : undefined,
    },
  );

  return res.data.result;
}
