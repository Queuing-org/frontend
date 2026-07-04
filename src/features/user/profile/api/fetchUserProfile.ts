import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import type { UserProfile } from "../model/types";

export async function fetchUserProfile(
  userSlug: string,
): Promise<UserProfile> {
  const { data } = await axiosInstance.get<ApiResponse<UserProfile>>(
    `/api/v1/user-profiles/${encodeURIComponent(userSlug)}`,
  );

  return unwrapApiResponse(data);
}
