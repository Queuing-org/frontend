import type { PlaybackStatus } from "@/src/entities/room/model/types";

export type GetPlaylistParams = {
  slug: string;
};

export type PlaylistProtectedRequestParams = {
  slug: string;
  password?: string | null;
};

export type RoomQueueRequestParams = PlaylistProtectedRequestParams & {
  offset?: number;
  size?: number;
};

export type MoveMyQueueEntryPayload = {
  movedEntryId: string;
  beforeEntryId: string | null;
};

export type MoveMyQueueEntryParams = PlaylistProtectedRequestParams &
  MoveMyQueueEntryPayload;

export type DeleteMyQueueEntryParams = PlaylistProtectedRequestParams & {
  entryId: string;
};

export type TrackProvider = "YOUTUBE" | (string & {});

export type PlaylistTrack = {
  title: string;
  videoId: string;
  provider: TrackProvider;
  durationMs: number;
  thumbnailUrl: string;
  regionRestriction: unknown | null;
};

export type PlaylistEntryStatus = {
  skipped: boolean;
  isActive: boolean;
  isPlayed: boolean;
};

export type PlaylistAddedBy = {
  userId: number | null;
  nickname: string;
  avatarUrl?: string | null;
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
export type RoomQueueResult = PlaylistEntry[];

export type PlaylistParticipant = {
  slug: string;
  userId: number;
  nickname: string;
  profileImageUrl?: string | null;
};

export type PlaybackSnapshot = {
  status: PlaybackStatus;
  videoId: string;
  currentTime: number;
  serverTimestamp: number;
};

export type RoomStateSnapshot = {
  queue: PlaylistEntry[];
  currentEntry?: PlaylistEntry | null;
  participants: PlaylistParticipant[];
  currentEntryId?: string | null;
  playbackStatus?: PlaybackSnapshot | null;
};
