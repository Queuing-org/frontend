"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { badgeKeys } from "@/src/features/badge/model/queryKeys";
import { followKeys } from "@/src/features/follow/model/queryKeys";
import { userKeys } from "@/src/features/user/model/queryKeys";
import { withdrawMe } from "../api/withdrawMe";

export function useWithdrawMe() {
  const qc = useQueryClient();

  return useMutation<void, ApiError, void>({
    mutationFn: withdrawMe,
    onSuccess: () => {
      qc.setQueryData(userKeys.me(), null);
      qc.removeQueries({ queryKey: badgeKeys.all() });
      qc.removeQueries({ queryKey: followKeys.all() });
      qc.removeQueries({ queryKey: userKeys.profileRoot() });
      qc.removeQueries({ queryKey: userKeys.searchRoot() });
    },
  });
}
