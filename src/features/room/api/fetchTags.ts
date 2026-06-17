import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { RoomTag } from "../model/types";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { ApiResponse } from "@/src/shared/api/types";

export async function fetchRoomTags(): Promise<RoomTag[]> {
  const res = await axiosInstance.get<ApiResponse<{ tags: RoomTag[] }>>(
    "/api/v1/tags"
  );

  return unwrapApiResponse(res.data).tags;
}
