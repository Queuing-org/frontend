"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { sendFollowRequest } from "../api/sendFollowRequest";
import type { SendFollowRequestPayload } from "../model/types";
import {
  followRequestTargetStatusQueryKey,
  type FollowRequestTargetStatus,
} from "./useFollowRequestTargetStatus";

type SendFollowRequestContext = {
  previousStatus?: FollowRequestTargetStatus;
};

export function useSendFollowRequest() {
  const qc = useQueryClient();

  return useMutation<
    boolean,
    ApiError,
    SendFollowRequestPayload,
    SendFollowRequestContext
  >({
    mutationKey: ["followRequests", "send"],
    mutationFn: (payload) => sendFollowRequest(payload),
    onMutate: (payload) => {
      const queryKey = followRequestTargetStatusQueryKey(payload.targetSlug);
      const previousStatus =
        qc.getQueryData<FollowRequestTargetStatus>(queryKey);

      qc.setQueryData<FollowRequestTargetStatus>(queryKey, "pending");

      return { previousStatus };
    },
    onError: (_error, payload, context) => {
      qc.setQueryData<FollowRequestTargetStatus>(
        followRequestTargetStatusQueryKey(payload.targetSlug),
        context?.previousStatus ?? "idle",
      );
    },
    onSuccess: (_data, payload) => {
      qc.setQueryData<FollowRequestTargetStatus>(
        followRequestTargetStatusQueryKey(payload.targetSlug),
        "sent",
      );
      qc.invalidateQueries({ queryKey: ["searchUsers"] });
    },
  });
}

// 추후 보낸 팔로우 요청 목록 관련 기능도 추가돼야 할 듯
