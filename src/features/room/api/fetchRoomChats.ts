import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { buildRoomPasswordHeaders } from "@/src/shared/api/roomPasswordHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { ChatHistoryResponse } from "../model/types";

export type FetchRoomChatsParams = {
  cursorId?: number | null;
  password?: string | null;
  size?: number;
  slug: string;
};

export async function fetchRoomChats({
  cursorId,
  password,
  size = 30,
  slug,
}: FetchRoomChatsParams): Promise<ChatHistoryResponse> {
  const res = await axiosInstance.get<ApiResponse<ChatHistoryResponse>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}/chats`,
    {
      params: {
        ...(typeof cursorId === "number" ? { cursorId } : {}),
        size,
      },
      headers: buildRoomPasswordHeaders(password),
    },
  );

  return unwrapApiResponse(res.data);
}
