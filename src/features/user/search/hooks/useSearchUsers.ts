import { useInfiniteQuery } from "@tanstack/react-query";
import type { SearchUserParams } from "../model/types";
import { searchUsers } from "../api/searchUsers";
import { userKeys } from "@/src/features/user/model/queryKeys";
import { MIN_USER_SEARCH_QUERY_LENGTH } from "../model/searchUserQuery";

export function useSearchUsers(params: SearchUserParams) {
  const normalizedParams = {
    ...params,
    query: params.query.trim(),
  };

  return useInfiniteQuery({
    queryKey: userKeys.search(normalizedParams.query, normalizedParams.limit),
    queryFn: ({ pageParam, signal }) =>
      searchUsers(
        {
          query: normalizedParams.query,
          limit: normalizedParams.limit,
          ...(typeof pageParam === "number" ? { lastId: pageParam } : {}),
        },
        signal,
      ),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage, allPages) => {
      const next = lastPage.hasNext ? lastPage.nextCursor : null;
      return typeof next === "number" &&
        !allPages.some((page) => page.nextCursor === next && page !== lastPage)
        ? next
        : undefined;
    },
    enabled:
      normalizedParams.query.length >= MIN_USER_SEARCH_QUERY_LENGTH,
  });
}
