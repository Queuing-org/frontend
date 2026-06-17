import { useQuery } from "@tanstack/react-query";
import { fetchRoomTags } from "../api/fetchTags";

export function useRoomTags() {
  return useQuery({
    queryKey: ["roomTags"],
    queryFn: fetchRoomTags,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
