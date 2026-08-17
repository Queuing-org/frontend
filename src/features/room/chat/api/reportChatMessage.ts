import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { buildRoomAccessTokenHeaders } from "@/src/shared/api/roomAccessTokenHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export type ReportChatMessageParams = {
  accessToken: string;
  messageKey: string;
  reason: string;
  slug: string;
};

export async function reportChatMessage({
  accessToken,
  messageKey,
  reason,
  slug,
}: ReportChatMessageParams): Promise<void> {
  const { data } = await axiosInstance.post<ApiResponse<unknown>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}/chat-messages/${encodeURIComponent(messageKey)}/reports`,
    { reason },
    { headers: buildRoomAccessTokenHeaders(accessToken) },
  );

  unwrapApiResponse(data);
}
