import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import {
  mapUserBadgeList,
  type UserBadgeListResponse,
} from "../model/mapUserBadgeList";
import type { PublicUserBadgeList } from "../model/types";

type PublicUserBadgeListResponse = UserBadgeListResponse & {
  userSlug?: string | null;
};

export async function fetchPublicUserBadges(
  userSlug: string,
  signal?: AbortSignal,
): Promise<PublicUserBadgeList> {
  const res = await axiosInstance.get<ApiResponse<PublicUserBadgeListResponse>>(
    `/api/v1/user-profiles/${encodeURIComponent(userSlug)}/badges`,
    { signal },
  );

  return mapUserBadgeList(unwrapApiResponse(res.data));
}
