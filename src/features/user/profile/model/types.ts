import type { BadgeSummary } from "@/src/features/badge/model/types";

export type UpdateMePayload = {
  nickname?: string;
  profileImageUrl?: string | null;
};

export type UserProfile = {
  userId?: number | null;
  nickname: string;
  slug: string;
  profileImageUrl: string | null;
  representativeBadge?: BadgeSummary | null;
  musicPower?: number;
  queuingCount?: number;
};

export type MusicPowerResponse = {
  musicPower: number;
  recommendedByMe: boolean;
  targetUserSlug: string;
};
