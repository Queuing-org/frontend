import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { buildRoomPasswordHeaders } from "@/src/shared/api/roomPasswordHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type {
  PlaylistParticipant,
  RoomParticipantsPage,
  RoomParticipantsRequestParams,
} from "../model/types";

const PARTICIPANT_PAGE_SIZE = 100;

export async function fetchRoomParticipantsPage({
  slug,
  password,
  cursor,
  size = PARTICIPANT_PAGE_SIZE,
}: RoomParticipantsRequestParams): Promise<RoomParticipantsPage> {
  const { data } = await axiosInstance.get<ApiResponse<RoomParticipantsPage>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}/participants`,
    {
      params: { ...(cursor ? { cursor } : {}), size },
      headers: buildRoomPasswordHeaders(password),
    },
  );

  return unwrapApiResponse(data);
}

export async function fetchRoomParticipants(
  params: Pick<RoomParticipantsRequestParams, "slug" | "password">,
): Promise<PlaylistParticipant[]> {
  const participants: PlaylistParticipant[] = [];
  let cursor: string | null = null;

  do {
    const page = await fetchRoomParticipantsPage({
      ...params,
      cursor,
      size: PARTICIPANT_PAGE_SIZE,
    });
    participants.push(...page.items);

    if (!page.hasNext || !page.nextCursor) {
      return participants;
    }

    cursor = page.nextCursor;
  } while (true);
}
