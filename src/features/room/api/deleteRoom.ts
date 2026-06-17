import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  assertApiBooleanResult,
  unwrapApiResponse,
} from "@/src/shared/api/api-response";
import { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export async function deleteRoom(slug: string): Promise<boolean> {
  const res = await axiosInstance.delete<ApiResponse<boolean>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}`
  );
  return assertApiBooleanResult(
    unwrapApiResponse(res.data),
    "방을 삭제하지 못했습니다.",
  );
}
