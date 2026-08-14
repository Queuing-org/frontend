"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { follow } from "../api/follow";
import type { FollowParams } from "../model/types";
import { followKeys } from "@/src/features/follow/model/queryKeys";
import { invalidateUserRelationshipQueries } from "@/src/features/follow/model/invalidateUserRelationshipQueries";

export function useFollow() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, FollowParams>({
    mutationKey: followKeys.follow(),
    mutationFn: (params) => follow(params),
    onSuccess: (_result, { targetSlug }) =>
      invalidateUserRelationshipQueries(queryClient, targetSlug),
  });
}
