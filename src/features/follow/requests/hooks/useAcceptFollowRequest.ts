"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { acceptFollowRequest } from "../api/acceptFollowRequest";
import type { AcceptFollowRequestParams } from "../model/types";

export function useAcceptFollowRequest() {
  const qc = useQueryClient();

  return useMutation<boolean, ApiError, AcceptFollowRequestParams>({
    mutationKey: ["followRequests", "accept"],
    mutationFn: (params) => acceptFollowRequest(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["followRequests", "received"] });
      qc.invalidateQueries({ queryKey: ["following"] });
      qc.invalidateQueries({ queryKey: ["searchUsers"] });
    },
  });
}
