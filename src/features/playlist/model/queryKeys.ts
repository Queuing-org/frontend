export const playlistKeys = {
  roomPlayback: (slug: string | null) => ["roomPlayback", slug] as const,
  roomPlaybackPrefix: (slug: string) => ["roomPlayback", slug] as const,
  roomQueue: (slug: string | null, mine = false) =>
    ["roomQueue", slug, mine ? "mine" : "all"] as const,
  roomQueuePrefix: (slug: string) => ["roomQueue", slug] as const,
  roomParticipants: (slug: string | null) =>
    ["roomParticipants", slug] as const,
  roomParticipantsPrefix: (slug: string) =>
    ["roomParticipants", slug] as const,
};
