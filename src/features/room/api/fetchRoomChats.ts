import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { buildRoomAccessTokenHeaders } from "@/src/shared/api/roomAccessTokenHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { ChatHistoryResponse } from "../model/types";

export type FetchRoomChatsParams = {
  accessToken: string;
  cursorId?: number | null;
  signal?: AbortSignal;
  size?: number;
  slug: string;
};

export async function fetchRoomChats({
  accessToken,
  cursorId,
  signal,
  size = 30,
  slug,
}: FetchRoomChatsParams): Promise<ChatHistoryResponse> {
  const res = await axiosInstance.get<ApiResponse<ChatHistoryResponse>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}/chat-messages`,
    {
      params: {
        ...(typeof cursorId === "number" ? { cursorId } : {}),
        size,
      },
      headers: buildRoomAccessTokenHeaders(accessToken),
      signal,
    },
  );

  return unwrapApiResponse(res.data);
}
