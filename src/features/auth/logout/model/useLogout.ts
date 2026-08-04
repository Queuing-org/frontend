// features/auth/logout/model/useLogout.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logoutApi } from "../api/logout";
import { userKeys } from "@/src/features/user/model/queryKeys";
import { badgeKeys } from "@/src/features/badge/model/queryKeys";

export function useLogout() {
  const qc = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => logoutApi(),
    onSuccess: () => {
      qc.setQueryData(userKeys.me(), null);
      qc.removeQueries({ queryKey: badgeKeys.me() });
    },
  });
}
