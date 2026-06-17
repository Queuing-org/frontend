import { useQuery } from "@tanstack/react-query";
import { fetchRoomTags } from "../api/fetchTags";
import { roomKeys } from "../model/queryKeys";

export function useRoomTags() {
  return useQuery({
    queryKey: roomKeys.tags(),
    queryFn: fetchRoomTags,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
