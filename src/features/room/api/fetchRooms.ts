import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { RoomsResponse } from "../model/types";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomTagSlugs } from "../model/roomTagFilters";

export type RoomCreatedOrder = "RANDOM" | "NEW" | "OLD";
export type RoomParticipantOrder = "RANDOM" | "HIGH" | "LOW";

export type RoomListQueryParams = {
  createdOrder: RoomCreatedOrder;
  keyword?: string;
  participantOrder: RoomParticipantOrder;
  tags?: string[];
};

export type FetchRoomsParams = {
  createdOrder?: RoomCreatedOrder;
  cursor?: string | null;
  keyword?: string;
  participantOrder?: RoomParticipantOrder;
  size?: number;
  tags?: readonly string[];
};

export async function fetchRooms({
  createdOrder,
  cursor,
  keyword,
  participantOrder,
  size,
  tags,
}: FetchRoomsParams = {}, signal?: AbortSignal): Promise<RoomsResponse> {
  const trimmedKeyword = keyword?.trim();
  const normalizedTags = normalizeRoomTagSlugs(tags);
  const normalizedCursor = cursor?.trim();

  const res = await axiosInstance.get<ApiResponse<RoomsResponse>>(
    "/api/v1/rooms",
    {
      params: {
        ...(trimmedKeyword ? { keyword: trimmedKeyword } : {}),
        ...(createdOrder ? { createdOrder } : {}),
        ...(participantOrder ? { participantOrder } : {}),
        ...(normalizedTags.length > 0
          ? { tags: normalizedTags.join(",") }
          : {}),
        ...(normalizedCursor ? { cursor: normalizedCursor } : {}),
        ...(typeof size === "number" ? { size } : {}),
      },
      signal,
    },
  );

  return unwrapApiResponse(res.data);
}
