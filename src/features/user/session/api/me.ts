import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { User } from "../../model/types";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { ApiResponse } from "@/src/shared/api/types";

export async function fetchMe(): Promise<User> {
  const { data } = await axiosInstance.get<ApiResponse<User>>(
    "/api/v1/user-profiles/me"
  );
  return unwrapApiResponse(data);
}
