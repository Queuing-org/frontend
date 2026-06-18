import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { RoomsResponse } from "../model/types";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { ApiResponse } from "@/src/shared/api/types";

export type RoomCreatedOrder = "RANDOM" | "NEW" | "OLD";
export type RoomParticipantOrder = "RANDOM" | "HIGH" | "LOW";

export type RoomListQueryParams = {
  createdOrder: RoomCreatedOrder;
  keyword?: string;
  participantOrder: RoomParticipantOrder;
};

export type FetchRoomsParams = {
  createdOrder?: RoomCreatedOrder;
  cursorLastCreatedAt?: string | null;
  cursorLastId?: number | null;
  cursorLastParticipantCount?: number | null;
  cursorLastRandomRank?: number | null;
  cursorSeed?: number | string | null;
  keyword?: string;
  lastId?: number | null;
  participantOrder?: RoomParticipantOrder;
  size?: number;
};

function isPresentQueryValue(value: unknown): value is number | string {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return typeof value === "string" && value.trim().length > 0;
}

export async function fetchRooms({
  createdOrder,
  cursorLastCreatedAt,
  cursorLastId,
  cursorLastParticipantCount,
  cursorLastRandomRank,
  cursorSeed,
  keyword,
  lastId,
  participantOrder,
  size,
}: FetchRoomsParams = {}): Promise<RoomsResponse> {
  const trimmedKeyword = keyword?.trim();
  const normalizedCursorSeed =
    typeof cursorSeed === "string" ? cursorSeed.trim() : cursorSeed;
  const normalizedCursorLastCreatedAt = cursorLastCreatedAt?.trim();

  const res = await axiosInstance.get<ApiResponse<RoomsResponse>>(
    "/api/v1/rooms",
    {
      params: {
        ...(trimmedKeyword ? { keyword: trimmedKeyword } : {}),
        ...(createdOrder ? { createdOrder } : {}),
        ...(participantOrder ? { participantOrder } : {}),
        ...(typeof lastId === "number" ? { lastId } : {}),
        ...(isPresentQueryValue(normalizedCursorSeed)
          ? { cursorSeed: normalizedCursorSeed }
          : {}),
        ...(typeof cursorLastId === "number" ? { cursorLastId } : {}),
        ...(isPresentQueryValue(normalizedCursorLastCreatedAt)
          ? { cursorLastCreatedAt: normalizedCursorLastCreatedAt }
          : {}),
        ...(typeof cursorLastRandomRank === "number"
          ? { cursorLastRandomRank }
          : {}),
        ...(typeof cursorLastParticipantCount === "number"
          ? { cursorLastParticipantCount }
          : {}),
        ...(typeof size === "number" ? { size } : {}),
      },
    },
  );

  return unwrapApiResponse(res.data);
}
