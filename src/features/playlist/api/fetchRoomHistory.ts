import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { buildRoomPasswordHeaders } from "@/src/shared/api/roomPasswordHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type {
  RoomHistoryPage,
  RoomHistoryRequestParams,
} from "../model/types";

export async function fetchRoomHistory({
  slug,
  password,
  cursorId,
  size = 100,
}: RoomHistoryRequestParams): Promise<RoomHistoryPage> {
  const { data } = await axiosInstance.get<ApiResponse<RoomHistoryPage>>(
    `/api/v1/rooms/${encodeURIComponent(normalizeRoomSlug(slug))}/queue-history`,
    {
      params: { ...(cursorId != null ? { cursorId } : {}), size },
      headers: buildRoomPasswordHeaders(password),
    },
  );

  return unwrapApiResponse(data);
}
