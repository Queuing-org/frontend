import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { fetchFollowing } from "../api/fetchFollowing";
import type { FetchFollowingParams } from "../model/types";
import { followKeys } from "@/src/features/follow/model/queryKeys";

export function useFollowingList(
  params?: FetchFollowingParams,
) {
  return useSuspenseInfiniteQuery({
    queryKey: followKeys.followings(undefined, params?.size),
    queryFn: ({ pageParam, signal }) => fetchFollowing({
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
