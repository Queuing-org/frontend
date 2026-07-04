export const userKeys = {
  me: () => ["me"] as const,
  profileRoot: () => ["userProfile"] as const,
  profile: (userSlug: string | null | undefined) =>
    [...userKeys.profileRoot(), userSlug ?? null] as const,
  search: (query: string, lastId?: number, limit?: number) =>
    ["searchUsers", query, lastId, limit] as const,
  searchRoot: () => ["searchUsers"] as const,
};
