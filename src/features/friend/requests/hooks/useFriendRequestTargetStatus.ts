"use client";

import { useQuery } from "@tanstack/react-query";

export type FriendRequestTargetStatus = "idle" | "pending" | "sent";

export function friendRequestTargetStatusQueryKey(
  targetSlug: string | null | undefined,
) {
  return ["friendRequests", "targetStatus", targetSlug ?? null] as const;
}

export function useFriendRequestTargetStatus(
  targetSlug: string | null | undefined,
) {
  return useQuery<FriendRequestTargetStatus>({
    queryKey: friendRequestTargetStatusQueryKey(targetSlug),
    queryFn: () => "idle",
    initialData: "idle",
    enabled: !!targetSlug,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
