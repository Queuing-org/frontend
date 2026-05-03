import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { ApiError } from "@/src/shared/api/api-error";
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
      headers: password
        ? {
            "X-Room-Password": password,
          }
        : undefined,
    },
  );

  if (!res.data.result) {
    throw new ApiError({
      message: "큐 항목을 삭제하지 못했습니다.",
      status: 500,
    });
  }

  return res.data.result;
}
