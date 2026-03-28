export type GetPlaylistParams = {
  slug: string;
};

export type PlaylistTrack = Record<string, unknown>;

export type PlaylistEntryStatus = Record<string, unknown>;

export type PlaylistAddedBy = Record<string, unknown>;

export type PlaylistEntry = {
  order: number;
  track: PlaylistTrack;
  status: PlaylistEntryStatus;
  addedBy: PlaylistAddedBy;
  entryId: string;
  createdAtMs: number;
  updatedAtMs: number;
};

export type PlaylistResult = PlaylistEntry[];
