import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import type { SearchUserParams, SearchUsersResponse } from "../model/types";

export async function searchUsers(
  params: SearchUserParams,
  signal?: AbortSignal,
): Promise<SearchUsersResponse> {
  const res = await axiosInstance.get<ApiResponse<SearchUsersResponse>>(
    "/api/v1/user-profiles",
    { params, signal },
  );
  return unwrapApiResponse(res.data);
}
