import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { buildRoomAccessTokenHeaders } from "@/src/shared/api/roomAccessTokenHeaders";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { DeleteMyQueueEntryParams } from "../model/types";

export async function deleteMyQueueEntry({
  slug,
  accessToken,
  entryId,
}: DeleteMyQueueEntryParams): Promise<void> {
  await axiosInstance.delete(
    `/api/v1/rooms/${encodeURIComponent(
      normalizeRoomSlug(slug),
    )}/queue-entries/${encodeURIComponent(entryId)}`,
    {
      headers: buildRoomAccessTokenHeaders(accessToken),
    },
  );

}
