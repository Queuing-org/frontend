"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { unfollow } from "../api/unfollow";
import type { UnfollowParams } from "../model/types";
import { followKeys } from "@/src/features/follow/model/queryKeys";
import { invalidateUserRelationshipQueries } from "@/src/features/follow/model/invalidateUserRelationshipQueries";

export function useUnfollow() {
  const qc = useQueryClient();

  return useMutation<void, ApiError, UnfollowParams>({
    mutationKey: followKeys.unfollow(),
    mutationFn: (params) => unfollow(params),
    onSuccess: (_result, { targetSlug }) =>
      invalidateUserRelationshipQueries(qc, targetSlug),
  });
}
