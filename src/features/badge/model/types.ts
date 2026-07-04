export type BadgeSummary = {
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  iconUrl?: string | null;
};

export type BadgeCatalogItem = BadgeSummary & {
  acquired?: boolean;
  acquisitionHint?: string | null;
  condition?: string | null;
  hint?: string | null;
  isAcquired?: boolean;
  owned?: boolean;
};

export type UserBadge = {
  badge?: BadgeSummary | null;
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  iconUrl?: string | null;
  acquiredAt?: string | null;
  isRepresentative?: boolean;
};

export type UserBadgeList = {
  badges?: UserBadge[];
  items?: UserBadge[];
  representativeBadge?: BadgeSummary | null;
};

export type PublicUserBadgeList = UserBadgeList & {
  userSlug?: string | null;
};

export type BadgeCatalogResponse =
  | BadgeCatalogItem[]
  | {
      badges?: BadgeCatalogItem[];
      items?: BadgeCatalogItem[];
    };

export type SetRepresentativeBadgePayload = {
  badgeSlug: string;
};
