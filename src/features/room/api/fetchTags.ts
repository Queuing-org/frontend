import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { RoomTag } from "../model/types";
import { ApiResponse } from "@/src/shared/api/types";

export async function fetchRoomTags(): Promise<RoomTag[]> {
  const res = await axiosInstance.get<ApiResponse<{ tags: RoomTag[] }>>(
    "/api/v1/tags"
  );

  return res.data.result.tags;
}
