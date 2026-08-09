import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import type { SearchUserParams, SearchUsersResponse } from "../model/types";
import { searchUsers } from "../api/searchUsers";
import { userKeys } from "@/src/features/user/model/queryKeys";
import { MIN_USER_SEARCH_QUERY_LENGTH } from "../model/searchUserQuery";

export function useSearchUsers(params: SearchUserParams) {
  const normalizedParams = {
    ...params,
    query: params.query.trim(),
  };

  return useQuery<SearchUsersResponse, ApiError>({
    queryKey: userKeys.search(
      normalizedParams.query,
      normalizedParams.lastId,
      normalizedParams.limit,
    ),
    queryFn: ({ signal }) => searchUsers(normalizedParams, signal),
    enabled:
      normalizedParams.query.length >= MIN_USER_SEARCH_QUERY_LENGTH,
  });
}
