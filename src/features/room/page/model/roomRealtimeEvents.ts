import type {
  PlaybackPosition,
  PlaylistAddedBy,
  PlaylistTrack,
  RoomPlayback,
} from "@/src/features/playlist/model/types";
import type {
  MusicPowerResponse,
  UserProfile,
} from "@/src/features/user/profile/model/types";
import type {
  RoomMeta,
  RoomOwner,
  RoomTag,
  WsEvent,
} from "@/src/features/room/model/types";

export type MusicPowerChangedData = {
  entryId: string;
  targetUserSlug: string;
  musicPower: number;
};

export type TrackStartedData = {
  entryId: string;
  track: PlaylistTrack;
  addedBy: PlaylistAddedBy;
  playbackStatus: PlaybackPosition;
  revision: number;
};

export type RoomOwnerChangedData = {
  previousOwner: RoomOwner | null;
  owner: RoomOwner | null;
};

export type RoomInfoUpdatedData = {
  title: string;
  hasPassword: boolean;
  maxParticipants: number | null;
  trackLimitMinutes: number | null;
  tags: RoomTag[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPlaybackPosition(value: unknown): value is PlaybackPosition {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.videoId === "string" &&
    typeof value.currentTime === "number" &&
    typeof value.serverTimestamp === "number" &&
    typeof value.status === "string" &&
    ["PLAYING", "PAUSED", "BUFFERING", "ENDED"].includes(value.status)
  );
}

function isRoomOwner(value: unknown): value is RoomOwner {
  return (
    isRecord(value) &&
    typeof value.slug === "string" &&
    typeof value.nickname === "string" &&
    (value.profileImageUrl === null ||
      typeof value.profileImageUrl === "string")
  );
}

function isRoomTag(value: unknown): value is RoomTag {
  return (
    isRecord(value) &&
    typeof value.slug === "string" &&
    typeof value.name === "string"
  );
}

export function parseRoomWsEvent(body: string): WsEvent | null {
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return null;
  }

  if (
    !isRecord(value) ||
    typeof value.type !== "string" ||
    typeof value.roomSlug !== "string" ||
    typeof value.timestamp !== "number" ||
    !("data" in value)
  ) {
    return null;
  }

  return value as WsEvent;
}

export function isMusicPowerChangedData(
  value: unknown,
): value is MusicPowerChangedData {
  return (
    isRecord(value) &&
    typeof value.entryId === "string" &&
    typeof value.targetUserSlug === "string" &&
    typeof value.musicPower === "number"
  );
}

export function isRoomOwnerChangedData(
  value: unknown,
): value is RoomOwnerChangedData {
  return (
    isRecord(value) &&
    (value.previousOwner === null || isRoomOwner(value.previousOwner)) &&
    (value.owner === null || isRoomOwner(value.owner))
  );
}

export function isRoomInfoUpdatedData(
  value: unknown,
): value is RoomInfoUpdatedData {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    typeof value.hasPassword === "boolean" &&
    (value.maxParticipants === null ||
      typeof value.maxParticipants === "number") &&
    (value.trackLimitMinutes === null ||
      typeof value.trackLimitMinutes === "number") &&
    Array.isArray(value.tags) &&
    value.tags.every(isRoomTag)
  );
}

export function isTrackStartedData(value: unknown): value is TrackStartedData {
  if (
    !isRecord(value) ||
    typeof value.entryId !== "string" ||
    typeof value.revision !== "number" ||
    !isRecord(value.track) ||
    !isRecord(value.addedBy)
  ) {
    return false;
  }

  const track = value.track;
  const addedBy = value.addedBy;

  return (
    typeof track.title === "string" &&
    typeof track.videoId === "string" &&
    typeof track.provider === "string" &&
    typeof track.durationMs === "number" &&
    (track.thumbnailUrl === null || typeof track.thumbnailUrl === "string") &&
    typeof addedBy.nickname === "string" &&
    (addedBy.slug === null || typeof addedBy.slug === "string") &&
    (addedBy.avatarUrl === null || typeof addedBy.avatarUrl === "string") &&
    isPlaybackPosition(value.playbackStatus)
  );
}

export function applyMusicPowerChange(
  current: MusicPowerResponse | undefined,
  change: MusicPowerChangedData,
) {
  if (!current) {
    return current;
  }

  return {
    ...current,
    musicPower: change.musicPower,
  };
}

export function applyRoomOwnerChange(
  current: RoomMeta | undefined,
  change: RoomOwnerChangedData,
) {
  return current ? { ...current, owner: change.owner } : current;
}

export function applyRoomInfoUpdate(
  current: RoomMeta | undefined,
  change: RoomInfoUpdatedData,
) {
  return current ? { ...current, ...change } : current;
}

export function applyMusicPowerToProfile<
  T extends UserProfile | undefined | null,
>(current: T, change: MusicPowerChangedData): T {
  if (!current || current.slug !== change.targetUserSlug) {
    return current;
  }

  return { ...current, musicPower: change.musicPower };
}

export function applyTrackStarted(
  current: RoomPlayback | undefined,
  data: TrackStartedData,
  timestamp: number,
): RoomPlayback {
  const previousEntry =
    current?.currentEntry?.entryId === data.entryId
      ? current.currentEntry
      : null;

  return {
    currentEntryId: data.entryId,
    currentEntry: {
      order: previousEntry?.order ?? 0,
      track: data.track,
      status: {
        skipped: false,
        isActive: true,
        isPlayed: false,
        ownerOrderLocked: previousEntry?.status.ownerOrderLocked ?? false,
      },
      addedBy: data.addedBy,
      entryId: data.entryId,
      story: previousEntry?.story ?? null,
      createdAtMs: previousEntry?.createdAtMs ?? timestamp,
      updatedAtMs: timestamp,
    },
    playbackStatus: data.playbackStatus,
    queueRevision: data.revision,
  };
}
