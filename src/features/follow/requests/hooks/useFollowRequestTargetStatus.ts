"use client";

import { useQuery } from "@tanstack/react-query";

export type FollowRequestTargetStatus = "idle" | "pending" | "sent";

export function followRequestTargetStatusQueryKey(
  targetSlug: string | null | undefined,
) {
  return ["followRequests", "targetStatus", targetSlug ?? null] as const;
}

export function useFollowRequestTargetStatus(
  targetSlug: string | null | undefined,
) {
  return useQuery<FollowRequestTargetStatus>({
    queryKey: followRequestTargetStatusQueryKey(targetSlug),
    queryFn: () => "idle",
    initialData: "idle",
    enabled: !!targetSlug,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
