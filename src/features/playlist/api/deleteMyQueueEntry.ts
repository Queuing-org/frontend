import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { buildRoomPasswordHeaders } from "@/src/shared/api/roomPasswordHeaders";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { DeleteMyQueueEntryParams } from "../model/types";

export async function deleteMyQueueEntry({
  slug,
  password,
  entryId,
}: DeleteMyQueueEntryParams): Promise<void> {
  await axiosInstance.delete(
    `/api/v1/rooms/${encodeURIComponent(
      normalizeRoomSlug(slug),
    )}/queue-entries/${encodeURIComponent(entryId)}`,
    {
      headers: buildRoomPasswordHeaders(password),
    },
  );

}
