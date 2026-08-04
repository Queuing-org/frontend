"use client";

import {
  useMutation,
  useMutationState,
  useQueryClient,
} from "@tanstack/react-query";
import { followKeys } from "@/src/features/follow/model/queryKeys";
import { userKeys } from "@/src/features/user/model/queryKeys";
import type { ApiError } from "@/src/shared/api/api-error";
import { unblockUser } from "../api/unblockUser";

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation<boolean, ApiError, string>({
    mutationKey: followKeys.unblock(),
    mutationFn: unblockUser,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: followKeys.all() }),
        queryClient.invalidateQueries({ queryKey: userKeys.searchRoot() }),
      ]),
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
