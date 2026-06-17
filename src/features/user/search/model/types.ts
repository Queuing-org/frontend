import { User } from "@/src/features/user/model/types";

export type UserRelationship =
  | "ME"
  | "FRIEND"
  | "FOLLOWING"
  | "FOLLOWER"
  | "NONE";

export type SearchUser = User & {
  id: number;
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
