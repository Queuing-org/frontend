"use client";

import { useMutation } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { sendFriendRequest } from "../api/sendFriendRequest";
import type { SendFriendRequestPayload } from "../model/types";

export function useSendFriendRequest() {
  return useMutation<boolean, ApiError, SendFriendRequestPayload>({
    mutationKey: ["friendRequests", "send"],
    mutationFn: (payload) => sendFriendRequest(payload),
  });
}

// 추후 보낸 친구요청 목록 관련 기능도 추가돼야 할 듯
