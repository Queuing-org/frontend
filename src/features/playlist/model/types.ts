import type { PlaybackStatus } from "@/src/features/room/model/types";

export type PlaylistProtectedRequestParams = {
  slug: string;
  accessToken: string;
};

export type RoomQueueRequestParams = PlaylistProtectedRequestParams & {
  cursor?: string | null;
  size?: number;
  mine?: boolean;
};

export type RoomQueueHistoryRequestParams = PlaylistProtectedRequestParams & {
  cursorId?: number | null;
  size?: number;
};

export type RoomParticipantsRequestParams =
  PlaylistProtectedRequestParams & {
    cursor?: string | null;
    size?: number;
  };

export type MoveMyQueueEntryPayload = {
  movedEntryId: string;
  beforeEntryId: string | null;
};

export type MoveMyQueueEntryParams = PlaylistProtectedRequestParams &
  MoveMyQueueEntryPayload;

export type MoveRoomQueueEntryParams = PlaylistProtectedRequestParams &
  MoveMyQueueEntryPayload;

export type DeleteMyQueueEntryParams = PlaylistProtectedRequestParams & {
  entryId: string;
};

export type DeleteRoomQueueEntriesParams = PlaylistProtectedRequestParams & {
  entryIds: string[];
};

export type TrackProvider = "YOUTUBE" | (string & {});

export type PlaylistTrack = {
  title: string;
  videoId: string;
  provider: TrackProvider;
  durationMs: number;
  thumbnailUrl: string | null;
};

export type RoomQueuePlaybackOrigin =
  | "USER_REQUESTED"
  | "AUTOMATIC_REPLAY";

export type PlaylistEntryStatus = {
  skipped: boolean;
  isActive: boolean;
  isPlayed: boolean;
  ownerOrdered: boolean;
  playbackOrigin?: RoomQueuePlaybackOrigin;
};

export type PlaylistAddedBy = {
  slug: string | null;
  nickname: string;
  avatarUrl: string | null;
};

export type PlaylistEntry = {
  order: number;
  track: PlaylistTrack;
  status: PlaylistEntryStatus;
  addedBy: PlaylistAddedBy;
  entryId: string;
  story?: string | null;
  createdAtMs: number;
  updatedAtMs: number;
};

export type PlaylistParticipant = {
  participantType: "USER" | "GUEST";
  participantId: string;
  userSlug: string | null;
  nickname: string;
  profileImageUrl: string | null;
};

export type PlaybackPosition = {
  status: PlaybackStatus;
  videoId: string;
  currentTime: number;
  serverTimestamp: number;
};

export type RoomPlayback = {
  currentEntry?: PlaylistEntry | null;
  currentEntryId?: string | null;
  playbackStatus?: PlaybackPosition | null;
  queueRevision: number;
};

export type RoomQueuePage = {
  items: PlaylistEntry[];
  hasNext: boolean;
  nextCursor: string | null;
  queueRevision: number;
  totalPendingCount: number;
};

export type RoomQueuePageParam = string;

export type RoomParticipantsPage = {
  items: PlaylistParticipant[];
  hasNext: boolean;
  nextCursor: string | null;
};

export type RoomQueueHistoryEntry = {
  id: number;
  title: string;
  entryId: string;
  skipped: boolean;
  startOffsetMs: number;
  videoId: string;
  provider: TrackProvider;
  playbackOrigin: RoomQueuePlaybackOrigin;
  endedAtMs: number;
  durationMs: number;
  queuedAtMs: number | null;
  startedAtMs: number | null;
  thumbnailUrl: string | null;
  addedByUserSlug: string | null;
};

export type RoomQueueHistoryPage = {
  items: RoomQueueHistoryEntry[];
  hasNext: boolean;
  nextCursor: number | null;
};

export type RoomQueueHistoryPageParam = number;
