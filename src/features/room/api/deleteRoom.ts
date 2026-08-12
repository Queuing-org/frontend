import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  assertApiBooleanResult,
  unwrapApiResponse,
} from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { DeleteRoomParams, DeleteRoomResult } from "./types";

type DeleteRoomResponse = ApiResponse<boolean>;

export async function deleteRoom({
  slug,
}: DeleteRoomParams): Promise<DeleteRoomResult> {
  const normalizedSlug = normalizeRoomSlug(slug);
  const response = await axiosInstance.delete<DeleteRoomResponse>(
    `/api/v1/rooms/${encodeURIComponent(normalizedSlug)}`,
  );

  return {
    success: assertApiBooleanResult(
      unwrapApiResponse(response.data),
      "방을 삭제하지 못했습니다.",
    ),
  };
}
