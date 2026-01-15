"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchReceivedFriendRequests } from "../api/fetchReceivedFriendRequests";
import {
  FetchReceivedFriendRequestsParams,
  ReceivedFriendRequestsResponse,
} from "../model/types";
import { ApiError } from "@/src/shared/api/api-error";

export function useFetchReceivedFriendRequest(
  params?: FetchReceivedFriendRequestsParams
) {
  return useQuery<ReceivedFriendRequestsResponse, ApiError>({
    queryKey: [
      "friendRequests",
      "received",
      params?.lastId ?? null,
      params?.limit ?? null,
    ],
    queryFn: () => fetchReceivedFriendRequests(params),
  });
}
