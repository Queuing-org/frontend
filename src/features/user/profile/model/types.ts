import type { BadgeSummary } from "@/src/features/badge/model/types";

export type UpdateMePayload = {
  nickname?: string;
  profileImageUrl?: string | null;
  statusMessage?: string;
};

export type UserProfile = {
  userId?: number | null;
  nickname: string;
  slug: string;
  profileImageUrl: string | null;
  statusMessage?: string | null;
  representativeBadge?: BadgeSummary | null;
  musicPower?: number;
  queuingCount?: number;
};

export type MusicPowerVote = "UPVOTE" | "DOWNVOTE";

export type MusicPowerResponse = {
  musicPower: number;
  myVote: MusicPowerVote | null;
  targetUserSlug: string;
};
