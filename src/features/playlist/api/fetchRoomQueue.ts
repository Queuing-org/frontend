import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { buildRoomPasswordHeaders } from "@/src/shared/api/roomPasswordHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type {
  RoomQueuePage,
  RoomQueueRequestParams,
} from "../model/types";

const QUEUE_PAGE_SIZE = 100;
export const QUEUE_CONFLICT_CODE = "room.queue-mutation-conflict";

export function getNextRoomQueuePageParam(page: RoomQueuePage) {
  if (!page.hasNext) {
    return undefined;
  }

  if (!page.nextCursor) {
    throw new ApiError({
      status: 500,
      code: "invalid-queue-page",
      message: "다음 큐 페이지 커서가 없습니다.",
    });
  }

  return {
    cursor: page.nextCursor,
    queueRevision: page.queueRevision,
  };
}

export async function fetchRoomQueuePage({
  slug,
  password,
  cursor,
  queueRevision,
  size = QUEUE_PAGE_SIZE,
  mine = false,
}: RoomQueueRequestParams): Promise<RoomQueuePage> {
  const playlistPath = mine ? "/playlist/me" : "/playlist";
  const res = await axiosInstance.get<ApiResponse<RoomQueuePage>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}${playlistPath}`,
    {
      params: {
        ...(cursor && queueRevision != null
          ? { cursor, queueRevision }
          : {}),
        size,
      },
      headers: buildRoomPasswordHeaders(password),
    },
  );

  return unwrapApiResponse(res.data);
}
