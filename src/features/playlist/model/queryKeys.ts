export const playlistKeys = {
  roomPlayback: (slug: string | null, password?: string | null) =>
    ["roomPlayback", slug, password ?? null] as const,
  roomPlaybackPrefix: (slug: string) => ["roomPlayback", slug] as const,
  roomQueue: (
    slug: string | null,
    password?: string | null,
    mine = false,
  ) => ["roomQueue", slug, password ?? null, mine ? "mine" : "all"] as const,
  roomQueuePrefix: (slug: string) => ["roomQueue", slug] as const,
  roomParticipants: (slug: string | null, password?: string | null) =>
    ["roomParticipants", slug, password ?? null] as const,
  roomParticipantsPrefix: (slug: string) =>
    ["roomParticipants", slug] as const,
  roomHistory: (slug: string | null, password?: string | null) =>
    ["roomHistory", slug, password ?? null] as const,
  roomHistoryPrefix: (slug: string) => ["roomHistory", slug] as const,
};
