"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { acceptFriendRequest } from "../api/acceptFriendRequest";
import type { AcceptFriendRequestParams } from "../model/types";

export function useAcceptFriendRequest() {
  const qc = useQueryClient();

  return useMutation<boolean, ApiError, AcceptFriendRequestParams>({
    mutationKey: ["friendRequests", "accept"],
    mutationFn: (params) => acceptFriendRequest(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friendRequests", "received"] });
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["searchUsers"] });
    },
  });
}
