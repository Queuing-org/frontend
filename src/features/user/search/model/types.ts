export type UserRelationship =
  | "ME"
  | "FRIEND"
  | "FOLLOWING"
  | "FOLLOWER"
  | "NONE";

export type SearchUser = {
  nickname: string;
  slug: string;
  profileImageUrl: string | null;
  relationship: UserRelationship;
};

export type SearchUsersResponse = {
  items: SearchUser[];
  hasNext: boolean;
};

export type SearchUserParams = {
  query: string;
  lastId?: number;
  limit?: number;
};
