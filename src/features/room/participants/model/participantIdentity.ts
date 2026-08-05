import type { PlaylistParticipant } from "@/src/features/playlist/model/types";

export type ParticipantKickTarget = {
  participantId?: string | null;
  userSlug?: string | null;
};

function normalizeIdentifier(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

export function getParticipantUserSlug(
  participant:
    | Pick<PlaylistParticipant, "userSlug">
    | null
    | undefined,
) {
  if (!participant) {
    return null;
  }

  return normalizeIdentifier(participant.userSlug);
}

export function isSameUser(
  participant: PlaylistParticipant | null | undefined,
  user: { slug?: string | null } | null | undefined,
) {
  if (!participant || !user) {
    return false;
  }

  const participantSlug = getParticipantUserSlug(participant);
  const userSlug = normalizeIdentifier(user.slug);
  return Boolean(
    participantSlug && userSlug && participantSlug === userSlug,
  );
}

export function isParticipantRoomOwner(
  owner: { slug?: string | null } | null | undefined,
  participant: PlaylistParticipant | null | undefined,
) {
  const ownerSlug = normalizeIdentifier(owner?.slug);
  const participantSlug = getParticipantUserSlug(participant);
  return Boolean(
    ownerSlug && participantSlug && ownerSlug === participantSlug,
  );
}

export function getParticipantIdentityKey(
  participant: PlaylistParticipant,
) {
  return `participant:${participant.participantId}`;
}

export function getParticipantKickTarget(
  participant: PlaylistParticipant,
): ParticipantKickTarget | null {
  const userSlug = getParticipantUserSlug(participant);
  if (userSlug) {
    return { userSlug };
  }

  const participantId = normalizeIdentifier(participant.participantId);
  if (participantId && participant.participantType !== "USER") {
    return { participantId };
  }

  return null;
}

export function getParticipantKickTargetForUser(
  participants: PlaylistParticipant[],
  user: { slug?: string | null } | null | undefined,
) {
  const userSlug = normalizeIdentifier(user?.slug);
  if (!userSlug) {
    return null;
  }

  const participant = participants.find(
    (candidate) => getParticipantUserSlug(candidate) === userSlug,
  );

  return participant ? getParticipantKickTarget(participant) : null;
}

export function getParticipantKickTargetKey(
  target: ParticipantKickTarget | null | undefined,
) {
  const userSlug = normalizeIdentifier(target?.userSlug);
  if (userSlug) {
    return `user:${userSlug}`;
  }

  const participantId = normalizeIdentifier(target?.participantId);
  if (participantId) {
    return `participant:${participantId}`;
  }

  return null;
}
