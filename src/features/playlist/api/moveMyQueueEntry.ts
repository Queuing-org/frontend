import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { buildRoomAccessTokenHeaders } from "@/src/shared/api/roomAccessTokenHeaders";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { MoveMyQueueEntryParams } from "../model/types";

export async function moveMyQueueEntry({
  slug,
  accessToken,
  movedEntryId,
  beforeEntryId,
}: MoveMyQueueEntryParams): Promise<void> {
  await axiosInstance.patch(
    `/api/v1/rooms/${encodeURIComponent(
      normalizeRoomSlug(slug),
    )}/queue-entries/${encodeURIComponent(movedEntryId)}`,
    {
      beforeEntryId,
    },
    {
      headers: buildRoomAccessTokenHeaders(accessToken),
    },
  );

}
