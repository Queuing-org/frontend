"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { clearRepresentativeBadge } from "../api/clearRepresentativeBadge";
import { invalidateRepresentativeBadgeQueries } from "../model/invalidateRepresentativeBadgeQueries";

export function useClearRepresentativeBadge() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError>({
    mutationFn: clearRepresentativeBadge,
    onSuccess: async () => {
      await invalidateRepresentativeBadgeQueries(queryClient);
    },
  });
}
