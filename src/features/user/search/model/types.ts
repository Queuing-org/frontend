import type { UserRelationship } from "@/src/features/user/model/types";
export type { UserRelationship } from "@/src/features/user/model/types";

export type SearchUser = {
  nickname: string;
  slug: string;
  profileImageUrl: string | null;
  relationship: UserRelationship;
};

export type SearchUsersResponse = {
  items: SearchUser[];
  hasNext: boolean;
  nextCursor: number | null;
};

export type SearchUserParams = {
  query: string;
  lastId?: number;
  limit?: number;
};
