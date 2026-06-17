import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import type { SearchUserParams, SearchUsersResponse } from "../model/types";
import { searchUsers } from "../api/searchUsers";
import { userKeys } from "@/src/features/user/model/queryKeys";

export function useSearchUsers(params: SearchUserParams) {
  return useQuery<SearchUsersResponse, ApiError>({
    queryKey: userKeys.search(params.query, params.lastId, params.limit),
    queryFn: () => searchUsers(params),
    enabled: params.query.trim().length > 0,
    retry: false,
  });
}
