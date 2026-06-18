"use client";

import { getRoomImageSrc } from "@/src/features/room/lib/getDefaultRoomImage";
import { isRoomOwner } from "@/src/features/room/lib/isRoomOwner";
import type { RoomStateSnapshot } from "@/src/features/playlist/model/types";
import type { PlaybackStatus, RoomMeta } from "@/src/features/room/model/types";
import type { CurrentRequesterProfile } from "@/src/features/room/profile/model/types";
import type { User } from "@/src/features/user/model/types";

export type LivePlaybackState = {
  roomSlug: string;
  status: PlaybackStatus;
  videoId: string;
  currentTime: number;
  serverTimestamp: number;
};

function getLatestPlaybackState(
  roomStatePlayback: RoomStateSnapshot["playbackStatus"] | null | undefined,
  livePlayback: LivePlaybackState | null,
) {
  if (!roomStatePlayback) {
    return livePlayback;
  }

  if (!livePlayback) {
    return roomStatePlayback;
  }

  return roomStatePlayback.serverTimestamp >= livePlayback.serverTimestamp
    ? roomStatePlayback
    : livePlayback;
}

function getCurrentVideoId(
  roomState: RoomStateSnapshot | undefined,
  playbackStatus:
    | LivePlaybackState
    | RoomStateSnapshot["playbackStatus"]
    | null,
) {
  const playbackVideoId = playbackStatus?.videoId;
  if (typeof playbackVideoId === "string" && playbackVideoId.trim()) {
    return playbackVideoId.trim();
  }

  const currentTrackVideoId = roomState?.currentEntry?.track.videoId;
  if (typeof currentTrackVideoId === "string" && currentTrackVideoId.trim()) {
    return currentTrackVideoId.trim();
  }

  return null;
}

function getStableRoomImageIndex(slug: string) {
  let hash = 0;

  for (let index = 0; index < slug.length; index += 1) {
    hash += slug.charCodeAt(index);
  }

  return hash;
}

function getCurrentRequesterProfile(
  roomState: RoomStateSnapshot | undefined,
): CurrentRequesterProfile | null {
  const requester = roomState?.currentEntry?.addedBy;
  if (!requester) {
    return null;
  }

  const matchedParticipant = roomState?.participants.find((participant) => {
    if (typeof requester.userId === "number") {
      return participant.userId === requester.userId;
    }

    return participant.nickname === requester.nickname;
  });

  return {
    avatarUrl: requester.avatarUrl ?? matchedParticipant?.profileImageUrl ?? null,
    nickname: requester.nickname,
    slug: matchedParticipant?.slug ?? null,
    userId: requester.userId,
  };
}

type UseRoomPlaybackViewModelParams = {
  currentUser: User | null | undefined;
  livePlaybackStatus: LivePlaybackState | null;
  roomMeta: RoomMeta | null | undefined;
  roomState: RoomStateSnapshot | undefined;
  slug: string;
};

export function useRoomPlaybackViewModel({
  currentUser,
  livePlaybackStatus,
  roomMeta,
  roomState,
  slug,
}: UseRoomPlaybackViewModelParams) {
  const backgroundImageSrc = getRoomImageSrc(
    roomMeta?.thumbnailUrl,
    getStableRoomImageIndex(slug),
  );
  const playbackStatus = getLatestPlaybackState(
    roomState?.playbackStatus,
    livePlaybackStatus?.roomSlug === slug ? livePlaybackStatus : null,
  );
  const currentRequester = getCurrentRequesterProfile(roomState);
  const currentTrack = roomState?.currentEntry?.track ?? null;

  return {
    backgroundImageSrc,
    currentRequester,
    currentTrackDurationMs: currentTrack?.durationMs ?? null,
    currentTrackTitle: currentTrack?.title ?? null,
    currentVideoId: getCurrentVideoId(roomState, playbackStatus),
    isCurrentRequesterRoomOwner: isRoomOwner(roomMeta?.owner, currentRequester),
    isCurrentUserRoomOwner: isRoomOwner(roomMeta?.owner, currentUser),
    playbackStatus,
  };
}
