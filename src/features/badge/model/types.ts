export type BadgeSummary = {
  badgeCode: string;
  name: string;
};

export type UserBadge = BadgeSummary & {
  acquisitionRate: number | null;
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

export type SetRepresentativeBadgePayload = {
  badgeCode: string;
};
