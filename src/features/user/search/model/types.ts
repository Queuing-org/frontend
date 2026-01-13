import { User } from "@/src/entities/user/model/types";

export type UserRelationship = "NONE" | "FRIEND";

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
