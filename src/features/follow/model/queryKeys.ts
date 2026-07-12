export const followKeys = {
  all: () => ["follows"] as const,
  block: () => ["follows", "block"] as const,
  follow: () => ["follows", "follow"] as const,
  followers: (lastId?: number, size?: number) =>
    ["follows", "followers", lastId ?? null, size ?? null] as const,
  followings: (lastId?: number, size?: number) =>
    ["follows", "followings", lastId ?? null, size ?? null] as const,
  unfollow: () => ["follows", "unfollow"] as const,
};
