import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { ApiError } from "@/src/shared/api/api-error";
import { buildRoomPasswordHeaders } from "@/src/shared/api/roomPasswordHeaders";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { DeleteRoomQueueEntriesParams } from "../model/types";

export async function deleteRoomQueueEntries({
  slug,
  password,
  entryIds,
}: DeleteRoomQueueEntriesParams): Promise<void> {
  if (entryIds.length === 0) {
    throw new ApiError({
      message: "삭제할 큐 항목이 없습니다.",
      status: 400,
    });
  }

  await axiosInstance.delete(
    `/api/v1/rooms/${encodeURIComponent(
      normalizeRoomSlug(slug),
    )}/queue-entries`,
    {
      data: { entryIds },
      headers: buildRoomPasswordHeaders(password),
    },
  );
}
