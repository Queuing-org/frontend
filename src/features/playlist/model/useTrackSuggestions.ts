"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { useDebouncedValue } from "@/src/shared/lib/useDebouncedValue";
import {
  fetchFrequentTracks,
  searchYouTubeVideos,
} from "../api/fetchTrackSuggestions";
import { classifyTrackInput } from "./trackSuggestions";
import { trackSuggestionKeys } from "./trackSuggestionKeys";

export function useTrackSuggestions(value: string, open: boolean) {
  const queryClient = useQueryClient();
  const me = useMe();
  const userSlug = !me.isError ? me.data?.slug ?? null : null;
  const input = classifyTrackInput(value);
  // IME can keep the last syllable composing after typing stops.
  // Debounce text changes; composition only guards keyboard selection in the UI.
  const debouncedQuery = useDebouncedValue(input.query, 300);
  const enabled = Boolean(userSlug) && open;
  const frequent = useQuery({
    queryKey: trackSuggestionKeys.frequent(userSlug),
    queryFn: ({ signal }) => fetchFrequentTracks(signal),
    enabled: enabled && input.kind === "frequent",
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const search = useQuery({
    queryKey: trackSuggestionKeys.search(userSlug, input.query),
    queryFn: ({ signal }) => searchYouTubeVideos(input.query, signal),
    enabled:
      enabled && input.kind === "search" && input.query === debouncedQuery,
    staleTime: 300_000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  useEffect(() => {
    if (!enabled || input.kind !== "frequent")
      void queryClient.cancelQueries({
        queryKey: trackSuggestionKeys.frequent(userSlug),
      });
    if (!enabled || input.kind !== "search")
      void queryClient.cancelQueries({
        queryKey: trackSuggestionKeys.search(userSlug, input.query),
      });
  }, [enabled, input.kind, input.query, queryClient, userSlug]);
  const query = input.kind === "frequent" ? frequent : search;
  return {
    input,
    loggedIn: Boolean(userSlug),
    items:
      enabled &&
      (input.kind === "frequent" ||
        (input.kind === "search" && input.query === debouncedQuery))
        ? query.data ?? []
        : [],
    loading:
      (input.kind === "search" && input.query !== debouncedQuery) ||
      query.isFetching,
    error: query.error,
  };
}
