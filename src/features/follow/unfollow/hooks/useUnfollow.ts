"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { unfollow } from "../api/unfollow";
import type { UnfollowParams } from "../model/types";
import { followKeys } from "@/src/features/follow/model/queryKeys";
import { userKeys } from "@/src/features/user/model/queryKeys";

export function useUnfollow() {
  const qc = useQueryClient();

  return useMutation<boolean, ApiError, UnfollowParams>({
    mutationKey: followKeys.unfollow(),
    mutationFn: (params) => unfollow(params),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: followKeys.all() });
      void qc.invalidateQueries({ queryKey: userKeys.searchRoot() });
    },
  });
}
