"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchReceivedFriendRequests } from "../api/fetchRecivedFriendRequests";
import {
  FetchReceivedFriendRequestsParams,
  ReceivedFriendRequestsResponse,
} from "../model/types";
import { ApiError } from "next/dist/server/api-utils";

export function useFetchRecivedFriendRequest(
  params?: FetchReceivedFriendRequestsParams
) {
  return useQuery<ReceivedFriendRequestsResponse, ApiError>({
    queryKey: [
      "friendRequests",
      "recived",
      params?.lastId ?? null,
      params?.limit ?? null,
    ],
    queryFn: () => fetchReceivedFriendRequests(params),
  });
}
