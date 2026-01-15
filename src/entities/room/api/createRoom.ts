import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";
import type { CreateRoomPayload, CreateRoomResult } from "./types";

type CreateRoomResponse = ApiResponse<{ slug: string }>;

export async function createRoom(
  payload: CreateRoomPayload
): Promise<CreateRoomResult> {
  const res = await axiosInstance.post<CreateRoomResponse>(
    "/api/v1/rooms",
    payload
  );

  const slug = res.data.result.slug;

  return { slug };
}
