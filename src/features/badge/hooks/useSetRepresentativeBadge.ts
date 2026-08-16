"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { updateRepresentativeBadge } from "../api/updateRepresentativeBadge";
import { invalidateRepresentativeBadgeQueries } from "../model/invalidateRepresentativeBadgeQueries";
import type { BadgeSummary, SetRepresentativeBadgePayload } from "../model/types";

export function useSetRepresentativeBadge() {
  const qc = useQueryClient();

  return useMutation<BadgeSummary, ApiError, SetRepresentativeBadgePayload>({
    mutationFn: updateRepresentativeBadge,
    onSuccess: async () => {
      await invalidateRepresentativeBadgeQueries(qc);
    },
  });
}
