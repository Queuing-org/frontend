"use client";

import { useMutation } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import {
  fetchRoomChats,
  type FetchRoomChatsParams,
} from "../api/fetchRoomChats";
import type { ChatHistoryResponse } from "../model/types";

export function useRoomChats() {
  return useMutation<ChatHistoryResponse, ApiError, FetchRoomChatsParams>({
    mutationFn: fetchRoomChats,
  });
}
