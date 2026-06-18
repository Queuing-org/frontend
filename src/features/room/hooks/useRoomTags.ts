import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { fetchRoomTags } from "../api/fetchTags";
import { roomKeys } from "../model/queryKeys";

const ROOM_TAGS_QUERY_OPTIONS = {
  queryKey: roomKeys.tags(),
  queryFn: fetchRoomTags,
  staleTime: 5 * 60 * 1000,
  retry: false,
};

export function useRoomTags() {
  return useSuspenseQuery({
    ...ROOM_TAGS_QUERY_OPTIONS,
  });
}

export function useRoomTagsQuery() {
  return useQuery({
    ...ROOM_TAGS_QUERY_OPTIONS,
  });
}
