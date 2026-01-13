import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { fetchFriends } from "../api/fetchFriends";
import type { FriendsListResponse } from "@/src/entities/friend/model/types";
import type { FetchFriendsParams } from "../model/types";

export function useFriendsList(params?: FetchFriendsParams) {
  return useQuery<FriendsListResponse, ApiError>({
    queryKey: ["friends", params?.lastId ?? null, params?.size ?? null],
    queryFn: () => fetchFriends(params),
    retry: false,
  });
}
