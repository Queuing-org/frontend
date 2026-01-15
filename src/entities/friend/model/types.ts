export type Friend = {
  id: number;
  nickname: string;
  slug: string;
  profileImageUrl: string;
};

export type FriendsListResponse = {
  items: Friend[];
  hasNext: boolean;
};
