export type SendFollowRequestPayload = {
  targetSlug: string;
};

export type ReceivedFollowRequest = {
  requestId: number;
  requesterId: number;
  requesterNickname: string;
  requesterSlug: string;
  requesterProfileImageUrl: string | null;
  createdAt: string;
};

export type ReceivedFollowRequestsResponse = {
  items: ReceivedFollowRequest[];
  hasNext: boolean;
};

export type FetchReceivedFollowRequestsParams = {
  lastId?: number;
  limit?: number;
};

export type AcceptFollowRequestParams = {
  requestId: number;
};
