export const badgeKeys = {
  all: () => ["badges"] as const,
  me: () => [...badgeKeys.all(), "me"] as const,
  publicUser: (userSlug: string | null | undefined) =>
    [...badgeKeys.all(), "publicUser", userSlug ?? null] as const,
};
