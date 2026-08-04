"use client";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { followKeys } from "@/src/features/follow/model/queryKeys";
import { fetchBlockedUsers } from "../api/fetchBlockedUsers";

const BLOCKED_USERS_PAGE_SIZE = 20;

export function useBlockedUsers() {
  return useSuspenseInfiniteQuery({
    queryKey: followKeys.blocked(BLOCKED_USERS_PAGE_SIZE),
    queryFn: ({ pageParam }) =>
      fetchBlockedUsers({
        ...(typeof pageParam === "number" ? { lastId: pageParam } : {}),
        size: BLOCKED_USERS_PAGE_SIZE,
      }),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext && typeof lastPage.nextCursor === "number"
        ? lastPage.nextCursor
        : undefined,
  });
}
