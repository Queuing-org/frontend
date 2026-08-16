export const userKeys = {
  me: () => ["me"] as const,
  profileRoot: () => ["userProfile"] as const,
  profile: (userSlug: string | null | undefined) =>
    [...userKeys.profileRoot(), userSlug ?? null] as const,
  musicPowerRoot: () => ["musicPower"] as const,
  musicPowerUserRoot: (userSlug: string | null | undefined) =>
    [...userKeys.musicPowerRoot(), userSlug ?? null] as const,
  musicPower: (
    userSlug: string | null | undefined,
    roomSlug?: string | null,
    entryId?: string | null,
  ) =>
    [
      ...userKeys.musicPowerUserRoot(userSlug),
      roomSlug ?? null,
      entryId ?? null,
    ] as const,
  search: (query: string, limit?: number) =>
    ["searchUsers", query, limit ?? null] as const,
  searchRoot: () => ["searchUsers"] as const,
};
