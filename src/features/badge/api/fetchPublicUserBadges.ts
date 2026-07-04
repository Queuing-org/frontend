import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import type { PublicUserBadgeList } from "../model/types";

export async function fetchPublicUserBadges(
  userSlug: string,
): Promise<PublicUserBadgeList> {
  const res = await axiosInstance.get<ApiResponse<PublicUserBadgeList>>(
    `/api/v1/users/${encodeURIComponent(userSlug)}/badges`,
  );

  return unwrapApiResponse(res.data);
}
