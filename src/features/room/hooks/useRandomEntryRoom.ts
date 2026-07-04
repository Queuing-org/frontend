"use client";

import { useMutation } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { fetchRandomEntryRoom } from "../api/fetchRandomEntryRoom";
import type { RandomEntryRoomResult } from "../api/types";

export function useRandomEntryRoom() {
  return useMutation<RandomEntryRoomResult, ApiError, void>({
    mutationFn: fetchRandomEntryRoom,
  });
}
