"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { fetchRoomState } from "../api/fetchRoomState";
import type { RoomStateSnapshot } from "./types";

export function useRoomState(
  slug: string | null,
  password?: string | null,
  enabled = true,
) {
  return useQuery<RoomStateSnapshot, ApiError>({
    queryKey: ["roomState", slug, password ?? null],
    queryFn: () => fetchRoomState({ slug: slug!, password }),
    enabled: enabled && !!slug,
    retry: false,
  });
}
