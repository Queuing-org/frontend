export const playlistKeys = {
  playlist: (slug: string | null) => ["playlist", slug] as const,
  roomPlayback: (slug: string | null, password?: string | null) =>
    ["roomPlayback", slug, password ?? null] as const,
  roomPlaybackPrefix: (slug: string) => ["roomPlayback", slug] as const,
  roomQueue: (
    slug: string | null,
    password?: string | null,
    offset = 0,
    size = 100,
  ) => ["roomQueue", slug, password ?? null, offset, size] as const,
  roomQueuePrefix: (slug: string) => ["roomQueue", slug] as const,
  roomState: (slug: string | null, password?: string | null) =>
    ["roomState", slug, password ?? null] as const,
  roomStatePrefix: (slug: string) => ["roomState", slug] as const,
};
