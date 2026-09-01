import type { UserBadge, UserBadgeList } from "./types";

type UserBadgeResponse = Omit<UserBadge, "acquisitionRate"> & {
  acquisitionRate?: unknown;
};

export type UserBadgeListResponse = Omit<UserBadgeList, "badges"> & {
  badges: UserBadgeResponse[];
};

type NormalizedUserBadgeList<T extends UserBadgeListResponse> = Omit<
  T,
  "badges"
> & {
  badges: UserBadge[];
};

export function normalizeAcquisitionRate(value: unknown): number | null {
  const parsedValue =
    typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : value;

  if (
    typeof parsedValue !== "number" ||
    !Number.isFinite(parsedValue) ||
    parsedValue < 0 ||
    parsedValue > 100
  ) {
    return null;
  }

  return parsedValue;
}

export function mapUserBadgeList<T extends UserBadgeListResponse>(
  response: T,
): NormalizedUserBadgeList<T> {
  const { badges, ...metadata } = response;

  return {
    ...metadata,
    badges: badges.map((badge) => ({
      ...badge,
      acquisitionRate: normalizeAcquisitionRate(badge.acquisitionRate),
    })),
  };
}
