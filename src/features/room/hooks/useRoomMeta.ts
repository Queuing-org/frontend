"use client";

import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import type { RoomMeta } from "../model/types";
import { fetchRoomMeta } from "../api/fetchRoomMeta";
import { roomKeys } from "../model/queryKeys";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import { ROOM_DISCOVERY_CACHE_POLICY } from "../model/roomDiscoveryCachePolicy";

export function useRoomMeta(slug: string) {
  return useSuspenseQuery<RoomMeta, ApiError>({
    queryKey: roomKeys.meta(slug),
    queryFn: () => fetchRoomMeta(slug),
  });
}

export function useRoomMetaQuery(slug: string | null | undefined) {
  const normalizedSlug = slug ? normalizeRoomSlug(slug) : "";

  return useQuery<RoomMeta, ApiError>({
    ...ROOM_DISCOVERY_CACHE_POLICY,
    queryKey: roomKeys.meta(normalizedSlug || null),
    queryFn: () => fetchRoomMeta(normalizedSlug),
    enabled: normalizedSlug.length > 0,
  });
}
