type UserLike = {
  participantId?: string | null;
  participantType?: string | null;
  slug?: string | null;
  userSlug?: string | null;
  userId?: number | null;
  nickname?: string | null;
};

export type ParticipantKickTarget = {
  participantId?: string | null;
  userSlug?: string | null;
};

function normalizeIdentifier(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

export function getParticipantUserSlug(user: UserLike | null | undefined) {
  if (!user) {
    return null;
  }

  const directSlug = normalizeIdentifier(user.userSlug ?? user.slug);
  if (directSlug) {
    return directSlug;
  }

  const participantId = normalizeIdentifier(user.participantId);
  if (user.participantType === "USER" && participantId?.startsWith("u_")) {
    return normalizeIdentifier(participantId.slice(2));
  }

  return null;
}

export function isSameUser(
  left: UserLike | null | undefined,
  right: UserLike | null | undefined,
) {
  if (!left || !right) {
    return false;
  }

  const leftSlug = getParticipantUserSlug(left);
  const rightSlug = getParticipantUserSlug(right);
  if (leftSlug && rightSlug) {
    return leftSlug === rightSlug;
  }

  if (left.userId != null && right.userId != null) {
    return left.userId === right.userId;
  }

  return false;
}

export function isRoomOwner(
  owner: UserLike | null | undefined,
  user: UserLike | null | undefined,
) {
  return isSameUser(owner, user);
}

export function getParticipantIdentityKey(
  participant: UserLike | null | undefined,
) {
  if (!participant) {
    return "participant:unknown";
  }

  const userSlug = getParticipantUserSlug(participant);
  if (userSlug) {
    return `user:${userSlug}`;
  }

  const participantId = normalizeIdentifier(participant.participantId);
  if (participantId) {
    return `participant:${participantId}`;
  }

  if (participant.userId != null) {
    return `legacy-user:${participant.userId}`;
  }

  return `nickname:${participant.nickname ?? "unknown"}`;
}

export function getParticipantKickTarget(
  participant: UserLike,
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
