// features/auth/logout/model/useLogout.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logoutApi } from "../api/logout";
import { trackSuggestionKeys } from "@/src/features/playlist/model/trackSuggestionKeys";
import { userKeys } from "@/src/features/user/model/queryKeys";
import { badgeKeys } from "@/src/features/badge/model/queryKeys";

export function useLogout() {
  const qc = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => logoutApi(),
    onSuccess: async () => {
      await qc.cancelQueries({ queryKey: userKeys.me(), exact: true });
      qc.setQueryData(userKeys.me(), null);
      qc.removeQueries({ queryKey: trackSuggestionKeys.all() });
      qc.removeQueries({ queryKey: badgeKeys.me() });
    },
  });
}
