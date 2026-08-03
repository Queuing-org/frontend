import type { PlaybackStatus } from "@/src/features/room/model/types";

export type PlaylistProtectedRequestParams = {
  slug: string;
  password?: string | null;
};

export type RoomQueueRequestParams = PlaylistProtectedRequestParams & {
  cursor?: string | null;
  queueRevision?: number | null;
  size?: number;
  mine?: boolean;
};

export type RoomParticipantsRequestParams =
  PlaylistProtectedRequestParams & {
    cursor?: string | null;
    size?: number;
  };

export type RoomHistoryRequestParams = PlaylistProtectedRequestParams & {
  cursorId?: number | null;
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

export type PlaylistEntryStatus = {
  skipped: boolean;
  isActive: boolean;
  isPlayed: boolean;
  ownerOrderLocked: boolean;
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

export type RoomQueuePageParam = {
  cursor: string;
  queueRevision: number;
};

export type RoomParticipantsPage = {
  items: PlaylistParticipant[];
  hasNext: boolean;
  nextCursor: string | null;
};

export type RoomHistoryEntry = {
  id: number;
  title: string;
  entryId: string;
  skipped: boolean;
  videoId: string;
  provider: TrackProvider;
  endedAtMs: number;
  durationMs: number;
  queuedAtMs: number | null;
  startedAtMs: number | null;
  thumbnailUrl: string;
  addedByUserSlug: string | null;
};

export type RoomHistoryPage = {
  items: RoomHistoryEntry[];
  hasNext: boolean;
  nextCursor: number | null;
};
