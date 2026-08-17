export type BadgeAward = {
  badgeCode: string;
  description: string | null;
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
        typeof badge.name === "string" &&
        (badge.description === null || typeof badge.description === "string"),
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

export function getBadgeAchievementCopy(badge: BadgeAward) {
  const description = badge.description?.trim();

  return {
    achievement: description || `'${badge.name}' 칭호 조건을 달성했습니다.`,
    award: "새로운 칭호를 획득했습니다!",
    encouragement: "더 열심히 참여해서 다음 칭호도 획득해보세요.",
  };
}
