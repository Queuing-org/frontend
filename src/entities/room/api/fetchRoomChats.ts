import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { ChatHistoryResponse } from "../model/types";

export type FetchRoomChatsParams = {
  cursorId?: number | null;
  size?: number;
  slug: string;
};

export async function fetchRoomChats({
  cursorId,
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
    },
  );

  return res.data.result;
}
