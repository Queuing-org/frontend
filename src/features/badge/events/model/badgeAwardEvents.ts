export type BadgeAward = {
  badgeCode: string;
  name: string;
};

export type BadgeAwardEventData = {
  roomSlug: string;
  userSlug: string;
  nickname: string;
  badges: BadgeAward[];
};

export function parseBadgeAwardEvent(data: string): BadgeAwardEventData | null {
  let value: unknown;
  try {
    value = JSON.parse(data);
  } catch {
    return null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<BadgeAwardEventData>;
  if (
    typeof candidate.roomSlug !== "string" ||
    typeof candidate.userSlug !== "string" ||
    typeof candidate.nickname !== "string" ||
    !Array.isArray(candidate.badges) ||
    !candidate.badges.every(
      (badge) =>
        badge &&
        typeof badge === "object" &&
        typeof badge.badgeCode === "string" &&
        typeof badge.name === "string",
    )
  ) {
    return null;
  }

  return candidate as BadgeAwardEventData;
}

export function enqueueUnseenBadgeAwards({
  eventId,
  badges,
  seen,
}: {
  eventId: string;
  badges: BadgeAward[];
  seen: Set<string>;
}) {
  const unseen: BadgeAward[] = [];

  for (const badge of badges) {
    const dedupeKey = `${eventId}:${badge.badgeCode}`;
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    unseen.push(badge);
  }

  return unseen;
}
