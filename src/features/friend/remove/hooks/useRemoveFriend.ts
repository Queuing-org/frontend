"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { removeFriend } from "../api/removeFriend";
import type { RemoveFriendParams } from "../model/types";

export function useRemoveFriend() {
  const qc = useQueryClient();

  return useMutation<boolean, ApiError, RemoveFriendParams>({
    mutationKey: ["friends", "remove"],
    mutationFn: (params) => removeFriend(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["searchUsers"] });
    },
  });
}
