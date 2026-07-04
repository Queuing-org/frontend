"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { fetchBadges } from "../api/fetchBadges";
import type { BadgeCatalogResponse } from "../model/types";
import { badgeKeys } from "../model/queryKeys";

export function useBadgeCatalog() {
  return useQuery<BadgeCatalogResponse, ApiError>({
    queryKey: badgeKeys.catalog(),
    queryFn: fetchBadges,
    retry: false,
  });
}
