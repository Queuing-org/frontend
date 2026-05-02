"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { sendFriendRequest } from "../api/sendFriendRequest";
import type { SendFriendRequestPayload } from "../model/types";
import {
  friendRequestTargetStatusQueryKey,
  type FriendRequestTargetStatus,
} from "./useFriendRequestTargetStatus";

type SendFriendRequestContext = {
  previousStatus?: FriendRequestTargetStatus;
};

export function useSendFriendRequest() {
  const qc = useQueryClient();

  return useMutation<
    boolean,
    ApiError,
    SendFriendRequestPayload,
    SendFriendRequestContext
  >({
    mutationKey: ["friendRequests", "send"],
    mutationFn: (payload) => sendFriendRequest(payload),
    onMutate: (payload) => {
      const queryKey = friendRequestTargetStatusQueryKey(payload.targetSlug);
      const previousStatus =
        qc.getQueryData<FriendRequestTargetStatus>(queryKey);

      qc.setQueryData<FriendRequestTargetStatus>(queryKey, "pending");

      return { previousStatus };
    },
    onError: (_error, payload, context) => {
      qc.setQueryData<FriendRequestTargetStatus>(
        friendRequestTargetStatusQueryKey(payload.targetSlug),
        context?.previousStatus ?? "idle",
      );
    },
    onSuccess: (_data, payload) => {
      qc.setQueryData<FriendRequestTargetStatus>(
        friendRequestTargetStatusQueryKey(payload.targetSlug),
        "sent",
      );
      qc.invalidateQueries({ queryKey: ["searchUsers"] });
    },
  });
}

// 추후 보낸 친구요청 목록 관련 기능도 추가돼야 할 듯
