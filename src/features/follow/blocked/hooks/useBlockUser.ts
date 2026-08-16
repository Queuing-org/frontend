"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followKeys } from "@/src/features/follow/model/queryKeys";
import { invalidateUserRelationshipQueries } from "@/src/features/follow/model/invalidateUserRelationshipQueries";
import type { ApiError } from "@/src/shared/api/api-error";
import { blockUser, type BlockUserParams } from "../api/blockUser";

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, BlockUserParams>({
    mutationKey: followKeys.block(),
    mutationFn: blockUser,
    onSuccess: (_result, { targetSlug }) =>
      invalidateUserRelationshipQueries(queryClient, targetSlug),
  });
}
