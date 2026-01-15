export type SendFriendRequestPayload = {
  targetSlug: string;
};

export type ReceivedFriendRequest = {
  requestId: number;
  requesterId: number;
  requesterNickname: string;
  requesterSlug: string;
  requesterProfileImageUrl: string | null;
  createdAt: string;
};

export type ReceivedFriendRequestsResponse = {
  items: ReceivedFriendRequest[];
  hasNext: boolean;
};

export type FetchReceivedFriendRequestsParams = {
  lastId?: number;
  limit?: number;
};

export type AcceptFriendRequestParams = {
  requestId: number;
};
