"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followKeys } from "@/src/features/follow/model/queryKeys";
import { userKeys } from "@/src/features/user/model/queryKeys";
import type { ApiError } from "@/src/shared/api/api-error";
import { blockUser } from "../api/blockUser";

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationKey: followKeys.block(),
    mutationFn: blockUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: followKeys.all() });
      void queryClient.invalidateQueries({ queryKey: userKeys.searchRoot() });
    },
  });
}
