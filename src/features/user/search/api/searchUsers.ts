import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import type { SearchUserParams, SearchUsersResponse } from "../model/types";

export async function searchUsers(
  params: SearchUserParams
): Promise<SearchUsersResponse> {
  const res = await axiosInstance.get<ApiResponse<SearchUsersResponse>>(
    "/api/v1/user-profiles",
    { params }
  );
  return unwrapApiResponse(res.data);
}
