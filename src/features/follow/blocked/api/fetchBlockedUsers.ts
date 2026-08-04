import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import type {
  BlockedUserListResponse,
  FetchBlockedUsersParams,
} from "../model/types";

export async function fetchBlockedUsers({
  lastId,
  size = 20,
}: FetchBlockedUsersParams = {}): Promise<BlockedUserListResponse> {
  const { data } = await axiosInstance.get<
    ApiResponse<BlockedUserListResponse>
  >("/api/v1/user-profiles/me/blocks", {
    params: {
      ...(typeof lastId === "number" ? { lastId } : {}),
      size,
    },
  });

  return unwrapApiResponse(data);
}
