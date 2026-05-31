"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { follow } from "../api/follow";
import type { FollowParams } from "../model/types";

export function useFollow() {
  const queryClient = useQueryClient();

  return useMutation<boolean, ApiError, FollowParams>({
    mutationKey: ["follows", "follow"],
    mutationFn: (params) => follow(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["follows"] });
      void queryClient.invalidateQueries({ queryKey: ["searchUsers"] });
    },
  });
}
