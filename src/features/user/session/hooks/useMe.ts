"use client";

import { useQuery } from "@tanstack/react-query";
import { User } from "../model/types";
import { fetchMe } from "../api/me";
import { ApiError } from "@/src/shared/api/api-error";

export function useMe() {
  return useQuery<User | null, ApiError>({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 0,
    retry: false,
  });
}
