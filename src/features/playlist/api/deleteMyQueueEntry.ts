import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  assertApiBooleanResult,
  unwrapApiResponse,
} from "@/src/shared/api/api-response";
import { buildRoomPasswordHeaders } from "@/src/shared/api/roomPasswordHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { DeleteMyQueueEntryParams } from "../model/types";

export async function deleteMyQueueEntry({
  slug,
  password,
  entryId,
}: DeleteMyQueueEntryParams): Promise<boolean> {
  const res = await axiosInstance.delete<ApiResponse<boolean>>(
    `/api/v1/rooms/${encodeURIComponent(
      normalizeRoomSlug(slug),
    )}/playlist/${encodeURIComponent(entryId)}`,
    {
      headers: buildRoomPasswordHeaders(password),
    },
  );

  return assertApiBooleanResult(
    unwrapApiResponse(res.data),
    "큐 항목을 삭제하지 못했습니다.",
  );
}
