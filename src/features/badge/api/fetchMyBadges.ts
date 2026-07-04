import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import type { UserBadgeList } from "../model/types";

export async function fetchMyBadges(): Promise<UserBadgeList> {
  const res = await axiosInstance.get<ApiResponse<UserBadgeList>>(
    "/api/v1/users/me/badges",
  );

  return unwrapApiResponse(res.data);
}
