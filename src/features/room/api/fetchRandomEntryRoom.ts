import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import type { RandomEntryRoomResult } from "./types";

export async function fetchRandomEntryRoom(): Promise<RandomEntryRoomResult> {
  const res = await axiosInstance.get<ApiResponse<RandomEntryRoomResult>>(
    "/api/v1/rooms/random",
  );

  return unwrapApiResponse(res.data);
}
