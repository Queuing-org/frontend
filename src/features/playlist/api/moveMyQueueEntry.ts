import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { buildRoomPasswordHeaders } from "@/src/shared/api/roomPasswordHeaders";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { MoveMyQueueEntryParams } from "../model/types";

export async function moveMyQueueEntry({
  slug,
  password,
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
      headers: buildRoomPasswordHeaders(password),
    },
  );

}
