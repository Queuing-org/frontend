"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchReceivedFollowRequests } from "../api/fetchReceivedFollowRequests";
import {
  FetchReceivedFollowRequestsParams,
  ReceivedFollowRequestsResponse,
} from "../model/types";
import type { ApiError } from "@/src/shared/api/api-error";

export function useFetchReceivedFollowRequest(
  params?: FetchReceivedFollowRequestsParams,
) {
  return useQuery<ReceivedFollowRequestsResponse, ApiError>({
    queryKey: [
      "followRequests",
      "received",
      params?.lastId ?? null,
      params?.limit ?? null,
    ],
    queryFn: () => fetchReceivedFollowRequests(params),
  });
}
