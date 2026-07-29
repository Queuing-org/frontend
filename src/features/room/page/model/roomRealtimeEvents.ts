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
import type { WsEvent } from "@/src/features/room/model/types";

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
    typeof track.thumbnailUrl === "string" &&
    typeof addedBy.nickname === "string" &&
    (addedBy.slug === undefined ||
      addedBy.slug === null ||
      typeof addedBy.slug === "string") &&
    (addedBy.avatarUrl === undefined ||
      addedBy.avatarUrl === null ||
      typeof addedBy.avatarUrl === "string") &&
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
      status: { skipped: false, isActive: true, isPlayed: false },
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
