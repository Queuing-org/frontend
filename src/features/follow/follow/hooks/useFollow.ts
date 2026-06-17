"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { follow } from "../api/follow";
import type { FollowParams } from "../model/types";
import { followKeys } from "@/src/features/follow/model/queryKeys";
import { userKeys } from "@/src/features/user/model/queryKeys";

export function useFollow() {
  const queryClient = useQueryClient();

  return useMutation<boolean, ApiError, FollowParams>({
    mutationKey: followKeys.follow(),
    mutationFn: (params) => follow(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: followKeys.all() });
      void queryClient.invalidateQueries({ queryKey: userKeys.searchRoot() });
    },
  });
}
