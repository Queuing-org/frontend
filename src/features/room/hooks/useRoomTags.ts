import { useSuspenseQuery } from "@tanstack/react-query";
import { fetchRoomTags } from "../api/fetchTags";
import { roomKeys } from "../model/queryKeys";

export function useRoomTags() {
  return useSuspenseQuery({
    queryKey: roomKeys.tags(),
    queryFn: fetchRoomTags,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
