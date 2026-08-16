import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { fetchFollowers } from "../api/fetchFollowers";
import type { FetchFollowersParams } from "../model/types";
import { followKeys } from "@/src/features/follow/model/queryKeys";

export function useFollowersList(
  params?: FetchFollowersParams,
) {
  return useSuspenseInfiniteQuery({
    queryKey: followKeys.followers(undefined, params?.size),
    queryFn: ({ pageParam, signal }) => fetchFollowers({
      size: params?.size,
      ...(typeof pageParam === "number" ? { lastId: pageParam } : {}),
    }, signal),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage, allPages) => {
      const next = lastPage.hasNext ? lastPage.nextCursor : null;
      return typeof next === "number" &&
        !allPages.some((page) => page !== lastPage && page.nextCursor === next)
        ? next
        : undefined;
    },
  });
}
