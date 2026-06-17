import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { ApiError } from "@/src/shared/api/api-error";
import {
  assertApiBooleanResult,
  unwrapApiResponse,
} from "@/src/shared/api/api-response";
import { buildRoomPasswordHeaders } from "@/src/shared/api/roomPasswordHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { DeleteRoomQueueEntriesParams } from "../model/types";

export async function deleteRoomQueueEntries({
  slug,
  password,
  entryIds,
}: DeleteRoomQueueEntriesParams): Promise<boolean> {
  if (entryIds.length === 0) {
    throw new ApiError({
      message: "삭제할 큐 항목이 없습니다.",
      status: 400,
    });
  }

  const res = await axiosInstance.patch<ApiResponse<boolean>>(
    `/api/v1/rooms/${encodeURIComponent(
      normalizeRoomSlug(slug),
    )}/playlist/delete`,
    {
      entryIds,
    },
    {
      headers: buildRoomPasswordHeaders(password),
    },
  );

  return assertApiBooleanResult(
    unwrapApiResponse(res.data),
    "큐 항목을 삭제하지 못했습니다.",
  );
}
