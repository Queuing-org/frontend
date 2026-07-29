export type BadgeSummary = {
  badgeCode: string;
  name: string;
};

export type BadgeCatalogItem = BadgeSummary & {
  description: string;
  category: string;
  tier: string;
  acquisitionHint: string;
  active: boolean;
  acquired: boolean;
};

export type UserBadge = BadgeSummary & {
  description: string;
  category: string;
  acquired: true;
  acquiredAt: string;
  representative: boolean;
};

export type UserBadgeList = {
  badges: UserBadge[];
  representativeBadge?: BadgeSummary | null;
};

export type PublicUserBadgeList = UserBadgeList & {
  userSlug?: string | null;
};

export type BadgeCatalogResponse = {
  badges: BadgeCatalogItem[];
};

export type SetRepresentativeBadgePayload = {
  badgeCode: string;
};
