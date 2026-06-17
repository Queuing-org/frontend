"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import type { RoomMeta } from "../model/types";
import { fetchRoomMeta } from "../api/fetchRoomMeta";
import { roomKeys } from "../model/queryKeys";

export function useRoomMeta(slug: string) {
  return useSuspenseQuery<RoomMeta, ApiError>({
    queryKey: roomKeys.meta(slug),
    queryFn: () => fetchRoomMeta(slug),
    retry: false,
  });
}
