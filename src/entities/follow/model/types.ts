export type FollowingUser = {
  id: number;
  nickname: string;
  slug: string;
  profileImageUrl: string;
};

export type FollowingListResponse = {
  items: FollowingUser[];
  hasNext: boolean;
};
