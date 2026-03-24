"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import type { RoomMeta } from "../model/types";
import { fetchRoomMeta } from "../api/fetchRoomMeta";

export function useRoomMeta(slug: string | null) {
  return useQuery<RoomMeta, ApiError>({
    queryKey: ["roomMeta", slug],
    queryFn: () => fetchRoomMeta(slug!),
    enabled: !!slug,
    retry: false,
  });
}
