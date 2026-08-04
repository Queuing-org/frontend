import type {
  BadgeCatalogItem,
  BadgeCatalogResponse,
  BadgeSummary,
  UserBadge,
  UserBadgeList,
} from "./types";

export function getBadgeCatalogItems(
  response: BadgeCatalogResponse,
): BadgeCatalogItem[] {
  return response.badges;
}

export function getUserBadgeItems(
  response: UserBadgeList | null | undefined,
): UserBadge[] {
  return response?.badges ?? [];
}

export function getBadgeSummaryFromUserBadge(
  userBadge: UserBadge | null | undefined,
): BadgeSummary | null {
  if (!userBadge) {
    return null;
  }

  return {
    badgeCode: userBadge.badgeCode,
    name: userBadge.name,
  };
}

export function getRepresentativeBadge(
  response: UserBadgeList | null | undefined,
): BadgeSummary | null {
  if (response?.representativeBadge) {
    return response.representativeBadge;
  }

  const representativeUserBadge = getUserBadgeItems(response).find(
    (userBadge) => userBadge.representative,
  );

  return getBadgeSummaryFromUserBadge(representativeUserBadge);
}

export function getBadgeCode(userBadge: UserBadge) {
  return userBadge.badgeCode;
}

export function getCatalogBadgeHint(badge: BadgeCatalogItem) {
  return badge.acquisitionHint;
}

export function isCatalogBadgeAcquired(
  badge: BadgeCatalogItem,
  acquiredBadgeCodes: ReadonlySet<string>,
) {
  return badge.acquired || acquiredBadgeCodes.has(badge.badgeCode);
}
