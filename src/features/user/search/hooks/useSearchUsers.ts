import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import type { SearchUserParams, SearchUsersResponse } from "../model/types";
import { searchUsers } from "../api/searchUsers";

export function useSearchUsers(params: SearchUserParams) {
  return useQuery<SearchUsersResponse, ApiError>({
    queryKey: ["searchUsers", params.query, params.lastId, params.limit],
    queryFn: () => searchUsers(params),
    enabled: params.query.trim().length > 0,
    retry: false,
  });
}
