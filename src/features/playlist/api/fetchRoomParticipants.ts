import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { buildRoomAccessTokenHeaders } from "@/src/shared/api/roomAccessTokenHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type {
  RoomParticipantsPage,
  RoomParticipantsRequestParams,
} from "../model/types";

export const PARTICIPANT_PAGE_SIZE = 100;

type FetchRoomParticipantsPageParams = RoomParticipantsRequestParams & {
  signal?: AbortSignal;
};

export function getNextRoomParticipantsPageParam(
  lastPage: RoomParticipantsPage,
  allPages: readonly RoomParticipantsPage[],
) {
  const nextCursor = lastPage.hasNext ? lastPage.nextCursor : null;
  if (!nextCursor) {
    return undefined;
  }

  const wasAlreadyExposed = allPages
    .slice(0, -1)
    .some((page) => page.nextCursor === nextCursor);

  return wasAlreadyExposed ? undefined : nextCursor;
}

export async function fetchRoomParticipantsPage({
  slug,
  accessToken,
  cursor,
  signal,
  size = PARTICIPANT_PAGE_SIZE,
}: FetchRoomParticipantsPageParams): Promise<RoomParticipantsPage> {
  const { data } = await axiosInstance.get<ApiResponse<RoomParticipantsPage>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}/participants`,
    {
      params: { ...(cursor ? { cursor } : {}), size },
      headers: buildRoomAccessTokenHeaders(accessToken),
      signal,
    },
  );

  return unwrapApiResponse(data);
}
