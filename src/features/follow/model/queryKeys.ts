export const followKeys = {
  all: () => ["follows"] as const,
  block: () => ["follows", "block"] as const,
  blocked: (size?: number) => ["follows", "blocked", size ?? null] as const,
  follow: () => ["follows", "follow"] as const,
  followers: (lastId?: number, size?: number) =>
    ["follows", "followers", lastId ?? null, size ?? null] as const,
  followersRoot: () => ["follows", "followers"] as const,
  followings: (lastId?: number, size?: number) =>
    ["follows", "followings", lastId ?? null, size ?? null] as const,
  followingRelationships: () =>
    ["follows", "relationships", "following"] as const,
  followingsRoot: () => ["follows", "followings"] as const,
  unfollow: () => ["follows", "unfollow"] as const,
  unblock: () => ["follows", "unblock"] as const,
};
