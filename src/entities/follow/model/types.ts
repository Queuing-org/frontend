export type FollowUser = {
  cursorId: number;
  nickname: string;
  slug: string;
  profileImageUrl: string | null;
};

export type FollowListResponse = {
  items: FollowUser[];
  hasNext: boolean;
  nextCursor: number | null;
};

export type FollowingUser = FollowUser;
export type FollowingListResponse = FollowListResponse;
export type FollowerUser = FollowUser;
export type FollowersListResponse = FollowListResponse;
