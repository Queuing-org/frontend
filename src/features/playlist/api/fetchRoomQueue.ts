import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { buildRoomPasswordHeaders } from "@/src/shared/api/roomPasswordHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type {
  RoomQueuePage,
  RoomQueueRequestParams,
  RoomQueueResult,
} from "../model/types";

const QUEUE_PAGE_SIZE = 100;
const QUEUE_CONFLICT_CODE = "room.queue-mutation-conflict";

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

async function fetchEveryQueuePage(
  params: PlaylistProtectedParams,
): Promise<RoomQueueResult> {
  const items: RoomQueueResult = [];
  let cursor: string | null = null;
  let queueRevision: number | null = null;

  do {
    const page = await fetchRoomQueuePage({
      ...params,
      cursor,
      queueRevision,
      size: QUEUE_PAGE_SIZE,
    });
    items.push(...page.items);

    if (!page.hasNext) {
      return items;
    }

    if (!page.nextCursor) {
      throw new ApiError({
        status: 500,
        code: "invalid-queue-page",
        message: "다음 큐 페이지 커서가 없습니다.",
      });
    }

    cursor = page.nextCursor;
    queueRevision = page.queueRevision;
  } while (true);
}

type PlaylistProtectedParams = Pick<
  RoomQueueRequestParams,
  "slug" | "password" | "mine"
>;

export async function fetchRoomQueue(
  params: PlaylistProtectedParams,
): Promise<RoomQueueResult> {
  try {
    return await fetchEveryQueuePage(params);
  } catch (error) {
    if (!(error instanceof ApiError) || error.code !== QUEUE_CONFLICT_CODE) {
      throw error;
    }

    return fetchEveryQueuePage(params);
  }
}
