import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { buildRoomAccessTokenHeaders } from "@/src/shared/api/roomAccessTokenHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type {
  RoomQueueHistoryPage,
  RoomQueueHistoryPageParam,
  RoomQueueHistoryRequestParams,
} from "../model/types";

export const QUEUE_HISTORY_PAGE_SIZE = 100;

type FetchRoomQueueHistoryPageParams = RoomQueueHistoryRequestParams & {
  signal?: AbortSignal;
};

export function getNextRoomQueueHistoryPageParam(
  page: RoomQueueHistoryPage,
  _pages: RoomQueueHistoryPage[],
  _pageParam: RoomQueueHistoryPageParam | null,
  pageParams: Array<RoomQueueHistoryPageParam | null>,
) {
  if (!page.hasNext || page.nextCursor === null) {
    return undefined;
  }

  return pageParams.includes(page.nextCursor)
    ? undefined
    : page.nextCursor;
}

export async function fetchRoomQueueHistoryPage({
  slug,
  accessToken,
  cursorId,
  signal,
  size = QUEUE_HISTORY_PAGE_SIZE,
}: FetchRoomQueueHistoryPageParams): Promise<RoomQueueHistoryPage> {
  const response = await axiosInstance.get<ApiResponse<RoomQueueHistoryPage>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}/queue-history`,
    {
      params: {
        ...(cursorId !== null && cursorId !== undefined ? { cursorId } : {}),
        size,
      },
      headers: buildRoomAccessTokenHeaders(accessToken),
      signal,
    },
  );

  return unwrapApiResponse(response.data);
}
