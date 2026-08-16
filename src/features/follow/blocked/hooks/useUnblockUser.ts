"use client";

import {
  useMutation,
  useMutationState,
  useQueryClient,
} from "@tanstack/react-query";
import { followKeys } from "@/src/features/follow/model/queryKeys";
import { invalidateUserRelationshipQueries } from "@/src/features/follow/model/invalidateUserRelationshipQueries";
import type { ApiError } from "@/src/shared/api/api-error";
import { unblockUser } from "../api/unblockUser";

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationKey: followKeys.unblock(),
    mutationFn: unblockUser,
    onSuccess: (_result, targetSlug) =>
      invalidateUserRelationshipQueries(queryClient, targetSlug),
  });
}

export function usePendingUnblockUserSlugs() {
  const pendingVariables = useMutationState({
    filters: {
      mutationKey: followKeys.unblock(),
      status: "pending",
    },
    select: (mutation) => mutation.state.variables,
  });

  return pendingVariables.filter(
    (variable): variable is string => typeof variable === "string",
  );
}
