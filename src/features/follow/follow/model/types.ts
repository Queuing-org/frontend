export type FollowParams = {
  targetSlug: string;
};

export type FollowRelationship =
  | "ME"
  | "FRIEND"
  | "FOLLOWING"
  | "FOLLOWER"
  | "NONE";
