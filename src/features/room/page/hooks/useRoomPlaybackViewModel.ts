"use client";

import {
  getRoomImageSrc,
  ROOM_HERO_IMAGE_VARIANTS,
} from "@/src/features/room/lib/getDefaultRoomImage";
import { isRoomOwner } from "@/src/features/room/lib/isRoomOwner";
import type {
  PlaybackPosition,
  PlaylistParticipant,
  RoomPlayback,
} from "@/src/features/playlist/model/types";
import { getParticipantUserSlug } from "@/src/features/room/participants/model/participantIdentity";
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
  roomPlaybackStatus: PlaybackPosition | null | undefined,
  livePlayback: LivePlaybackState | null,
) {
  if (!roomPlaybackStatus) {
    return livePlayback;
  }

  if (!livePlayback) {
    return roomPlaybackStatus;
  }

  return roomPlaybackStatus.serverTimestamp >= livePlayback.serverTimestamp
    ? roomPlaybackStatus
    : livePlayback;
}

function getCurrentVideoId(
  roomPlayback: RoomPlayback | undefined,
  playbackStatus:
    | LivePlaybackState
    | PlaybackPosition
    | null,
) {
  const playbackVideoId = playbackStatus?.videoId;
  if (typeof playbackVideoId === "string" && playbackVideoId.trim()) {
    return playbackVideoId.trim();
  }

  const currentTrackVideoId = roomPlayback?.currentEntry?.track.videoId;
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
  roomPlayback: RoomPlayback | undefined,
  participants: PlaylistParticipant[],
): CurrentRequesterProfile | null {
  const requester = roomPlayback?.currentEntry?.addedBy;
  if (!requester) {
    return null;
  }

  const requesterSlug = requester.slug?.trim() || null;
  const matchedParticipant = participants.find((participant) => {
    const participantSlug = getParticipantUserSlug(participant);
    if (requesterSlug && participantSlug) {
      return participantSlug === requesterSlug;
    }

    if (typeof requester.userId === "number") {
      return participant.userId === requester.userId;
    }

    return participant.nickname === requester.nickname;
  });
  const matchedParticipantSlug = getParticipantUserSlug(matchedParticipant);

  return {
    avatarUrl: requester.avatarUrl ?? matchedParticipant?.profileImageUrl ?? null,
    nickname: requester.nickname,
    slug: requesterSlug ?? matchedParticipantSlug,
    userId: requester.userId ?? matchedParticipant?.userId ?? null,
  };
}

type UseRoomPlaybackViewModelParams = {
  currentUser: User | null | undefined;
  livePlaybackStatus: LivePlaybackState | null;
  participants: PlaylistParticipant[];
  roomPlayback: RoomPlayback | undefined;
  roomMeta: RoomMeta | null | undefined;
  slug: string;
};

export function useRoomPlaybackViewModel({
  currentUser,
  livePlaybackStatus,
  participants,
  roomPlayback,
  roomMeta,
  slug,
}: UseRoomPlaybackViewModelParams) {
  const backgroundImageSrc = getRoomImageSrc({
    fallbackSeed: getStableRoomImageIndex(slug),
    preferredVariants: ROOM_HERO_IMAGE_VARIANTS,
    thumbnailUrl: roomMeta?.thumbnailUrl,
    thumbnailUrls: roomMeta?.thumbnailUrls,
  });
  const playbackStatus = getLatestPlaybackState(
    roomPlayback?.playbackStatus,
    livePlaybackStatus?.roomSlug === slug ? livePlaybackStatus : null,
  );
  const currentRequester = getCurrentRequesterProfile(
    roomPlayback,
    participants,
  );
  const currentEntry = roomPlayback?.currentEntry ?? null;
  const currentTrack = currentEntry?.track ?? null;

  return {
    backgroundImageSrc,
    currentRequester,
    currentTrackDurationMs: currentTrack?.durationMs ?? null,
    currentTrackStory: currentEntry?.story ?? null,
    currentTrackTitle: currentTrack?.title ?? null,
    currentVideoId: getCurrentVideoId(roomPlayback, playbackStatus),
    isCurrentRequesterRoomOwner: isRoomOwner(roomMeta?.owner, currentRequester),
    isCurrentUserRoomOwner: isRoomOwner(roomMeta?.owner, currentUser),
    playbackStatus,
  };
}
