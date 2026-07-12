import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { buildRoomPasswordHeaders } from "@/src/shared/api/roomPasswordHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export type ReportChatMessageParams = {
  messageKey: string;
  password?: string | null;
  reason: string;
  slug: string;
};

export async function reportChatMessage({
  messageKey,
  password,
  reason,
  slug,
}: ReportChatMessageParams): Promise<void> {
  const { data } = await axiosInstance.post<ApiResponse<unknown>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}/chat-messages/${encodeURIComponent(messageKey)}/reports`,
    { reason },
    { headers: buildRoomPasswordHeaders(password) },
  );

  unwrapApiResponse(data);
}
