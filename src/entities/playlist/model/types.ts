import type { PlaybackStatus } from "@/src/entities/room/model/types";

export type GetPlaylistParams = {
  slug: string;
};

export type PlaylistProtectedRequestParams = {
  slug: string;
  password?: string | null;
};

export type TrackProvider = "YOUTUBE" | (string & {});

export type PlaylistTrack = {
  videoId: string;
  provider: TrackProvider;
  title?: string | null;
  thumbnailUrl?: string | null;
  durationMs?: number | null;
  [key: string]: unknown;
};

export type PlaylistEntryStatus = {
  [key: string]: unknown;
};

export type PlaylistAddedBy = {
  [key: string]: unknown;
};

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

export type PlaylistParticipant = {
  id?: string | null;
  participantId?: string | null;
  userId?: number | null;
  nickname?: string | null;
  profileImageUrl?: string | null;
  role?: string | null;
  type?: string | null;
  [key: string]: unknown;
};

export type PlaybackSnapshot = {
  status: PlaybackStatus;
  videoId: string;
  currentTime: number;
  serverTimestamp: number;
};

export type RoomStateSnapshot = {
  queue: PlaylistEntry[];
  currentEntry: PlaylistEntry | null;
  participants: PlaylistParticipant[];
  currentEntryId?: string | null;
  playbackStatus?: PlaybackSnapshot | null;
};
