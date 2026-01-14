export type Friend = {
  id: string;
  nickname: string;
  slug: string;
  profileImageUrl: string;
};

export type FriendsListResponse = {
  items: Friend[];
  hasNext: boolean;
};
