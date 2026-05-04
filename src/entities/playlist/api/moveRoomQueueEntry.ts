import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { ApiError } from "@/src/shared/api/api-error";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { MoveRoomQueueEntryParams } from "../model/types";

export async function moveRoomQueueEntry({
  slug,
  password,
  movedEntryId,
  beforeEntryId,
}: MoveRoomQueueEntryParams): Promise<boolean> {
  const res = await axiosInstance.patch<ApiResponse<boolean>>(
    `/api/v1/rooms/${encodeURIComponent(
      normalizeRoomSlug(slug),
    )}/playlist/move`,
    {
      beforeEntryId,
      movedEntryId,
    },
    {
      headers: password
        ? {
            "X-Room-Password": password,
          }
        : undefined,
    },
  );

  if (!res.data.result) {
    throw new ApiError({
      message: "큐 순서를 변경하지 못했습니다.",
      status: 500,
    });
  }

  return res.data.result;
}
