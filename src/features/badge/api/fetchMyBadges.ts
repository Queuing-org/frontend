import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import {
  mapUserBadgeList,
  type UserBadgeListResponse,
} from "../model/mapUserBadgeList";
import type { UserBadgeList } from "../model/types";

export async function fetchMyBadges(): Promise<UserBadgeList> {
  const res = await axiosInstance.get<ApiResponse<UserBadgeListResponse>>(
    "/api/v1/user-profiles/me/badges",
  );

  return mapUserBadgeList(unwrapApiResponse(res.data));
}
