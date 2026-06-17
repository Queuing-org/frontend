import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  assertApiBooleanResult,
  unwrapApiResponse,
} from "@/src/shared/api/api-response";
import { buildRoomPasswordHeaders } from "@/src/shared/api/roomPasswordHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { MoveMyQueueEntryParams } from "../model/types";

export async function moveMyQueueEntry({
  slug,
  password,
  movedEntryId,
  beforeEntryId,
}: MoveMyQueueEntryParams): Promise<boolean> {
  const res = await axiosInstance.patch<ApiResponse<boolean>>(
    `/api/v1/rooms/${encodeURIComponent(
      normalizeRoomSlug(slug),
    )}/playlist/me/move`,
    {
      beforeEntryId,
      movedEntryId,
    },
    {
      headers: buildRoomPasswordHeaders(password),
    },
  );

  return assertApiBooleanResult(
    unwrapApiResponse(res.data),
    "큐 순서를 변경하지 못했습니다.",
  );
}
