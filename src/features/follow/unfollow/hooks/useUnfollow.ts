"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { unfollow } from "../api/unfollow";
import type { UnfollowParams } from "../model/types";

export function useUnfollow() {
  const qc = useQueryClient();

  return useMutation<boolean, ApiError, UnfollowParams>({
    mutationKey: ["following", "unfollow"],
    mutationFn: (params) => unfollow(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["following"] });
      qc.invalidateQueries({ queryKey: ["searchUsers"] });
    },
  });
}
