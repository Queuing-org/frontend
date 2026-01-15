import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { ApiResponse } from "@/src/shared/api/types";
import type { SearchUserParams, SearchUsersResponse } from "../model/types";

export async function searchUsers(
  params: SearchUserParams
): Promise<SearchUsersResponse> {
  const res = await axiosInstance.get<ApiResponse<SearchUsersResponse>>(
    "/api/v1/user-profiles",
    { params }
  );
  return res.data.result;
}
