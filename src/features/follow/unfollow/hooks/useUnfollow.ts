"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { unfollow } from "../api/unfollow";
import type { UnfollowParams } from "../model/types";

export function useUnfollow() {
  const qc = useQueryClient();

  return useMutation<boolean, ApiError, UnfollowParams>({
    mutationKey: ["follows", "unfollow"],
    mutationFn: (params) => unfollow(params),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["follows"] });
      void qc.invalidateQueries({ queryKey: ["searchUsers"] });
    },
  });
}
