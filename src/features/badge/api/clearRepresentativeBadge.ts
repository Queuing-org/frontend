import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  assertApiBooleanResult,
  unwrapApiResponse,
} from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";

export async function clearRepresentativeBadge(): Promise<boolean> {
  const { data } = await axiosInstance.delete<ApiResponse<boolean>>(
    "/api/v1/users/me/badges/representative",
  );

  return assertApiBooleanResult(
    unwrapApiResponse(data),
    "대표 칭호를 해제하지 못했습니다.",
  );
}
