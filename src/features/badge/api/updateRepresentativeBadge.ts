import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import type { BadgeSummary, SetRepresentativeBadgePayload } from "../model/types";

export async function updateRepresentativeBadge(
  payload: SetRepresentativeBadgePayload,
): Promise<BadgeSummary> {
  const { data } = await axiosInstance.put<ApiResponse<BadgeSummary>>(
    "/api/v1/user-profiles/me/representative-badge",
    payload,
  );

  return unwrapApiResponse(data);
}
