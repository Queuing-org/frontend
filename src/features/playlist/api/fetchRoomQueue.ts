import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { buildRoomAccessTokenHeaders } from "@/src/shared/api/roomAccessTokenHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type {
  RoomQueuePage,
  RoomQueueRequestParams,
} from "../model/types";

export const QUEUE_PAGE_SIZE = 30;
export const QUEUE_CONFLICT_CODE = "room.queue-update-conflict";

type FetchRoomQueuePageParams = RoomQueueRequestParams & {
  signal?: AbortSignal;
};

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

  return page.nextCursor;
}

export async function fetchRoomQueuePage({
  slug,
  accessToken,
  cursor,
  signal,
  size = QUEUE_PAGE_SIZE,
  mine = false,
}: FetchRoomQueuePageParams): Promise<RoomQueuePage> {
  const queuePath = mine ? "/queue-entries/me" : "/queue-entries";
  const res = await axiosInstance.get<ApiResponse<RoomQueuePage>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}${queuePath}`,
    {
      params: {
        ...(cursor ? { cursor } : {}),
        size,
      },
      headers: buildRoomAccessTokenHeaders(accessToken),
      signal,
    },
  );

  return unwrapApiResponse(res.data);
}
