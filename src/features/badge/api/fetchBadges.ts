import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import type { BadgeCatalogResponse } from "../model/types";

export async function fetchBadges(): Promise<BadgeCatalogResponse> {
  const res = await axiosInstance.get<ApiResponse<BadgeCatalogResponse>>(
    "/api/v1/badges",
  );

  return unwrapApiResponse(res.data);
}
