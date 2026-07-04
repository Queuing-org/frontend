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
  if (Array.isArray(response)) {
    return response;
  }

  return response.items ?? response.badges ?? [];
}

export function getUserBadgeItems(
  response: UserBadgeList | null | undefined,
): UserBadge[] {
  return response?.items ?? response?.badges ?? [];
}

export function getBadgeSummaryFromUserBadge(
  userBadge: UserBadge | null | undefined,
): BadgeSummary | null {
  if (!userBadge) {
    return null;
  }

  if (userBadge.badge?.slug && userBadge.badge.name) {
    return userBadge.badge;
  }

  if (userBadge.slug && userBadge.name) {
    return {
      slug: userBadge.slug,
      name: userBadge.name,
      description: userBadge.description,
      imageUrl: userBadge.imageUrl,
      iconUrl: userBadge.iconUrl,
    };
  }

  return null;
}

export function getRepresentativeBadge(
  response: UserBadgeList | null | undefined,
): BadgeSummary | null {
  if (response?.representativeBadge) {
    return response.representativeBadge;
  }

  const representativeUserBadge = getUserBadgeItems(response).find(
    (userBadge) => userBadge.isRepresentative,
  );

  return getBadgeSummaryFromUserBadge(representativeUserBadge);
}

export function getBadgeSlug(userBadge: UserBadge) {
  return userBadge.badge?.slug ?? userBadge.slug ?? null;
}

export function getCatalogBadgeHint(badge: BadgeCatalogItem) {
  return badge.hint ?? badge.acquisitionHint ?? badge.condition ?? null;
}

export function isCatalogBadgeAcquired(
  badge: BadgeCatalogItem,
  acquiredBadgeSlugs: ReadonlySet<string>,
) {
  return (
    badge.owned === true ||
    badge.acquired === true ||
    badge.isAcquired === true ||
    acquiredBadgeSlugs.has(badge.slug)
  );
}
