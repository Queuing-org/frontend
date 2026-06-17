import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  assertApiBooleanResult,
  unwrapApiResponse,
} from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { UpdateRoomParams, UpdateRoomResult } from "./types";

type UpdateRoomResponse = ApiResponse<boolean>;

export async function updateRoom({
  slug,
  payload,
}: UpdateRoomParams): Promise<UpdateRoomResult> {
  const normalizedSlug = normalizeRoomSlug(slug);
  const res = await axiosInstance.patch<UpdateRoomResponse>(
    `/api/v1/rooms/${encodeURIComponent(normalizedSlug)}`,
    payload,
  );

  return {
    success: assertApiBooleanResult(
      unwrapApiResponse(res.data),
      "방 정보를 수정하지 못했습니다.",
    ),
  };
}
