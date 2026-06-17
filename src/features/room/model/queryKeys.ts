export const roomKeys = {
  all: () => ["rooms"] as const,
  delete: () => ["rooms", "delete"] as const,
  meta: (slug: string | null) => ["roomMeta", slug] as const,
  tags: () => ["roomTags"] as const,
};
