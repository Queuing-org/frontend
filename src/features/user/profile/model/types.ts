import type { BadgeSummary } from "@/src/features/badge/model/types";

export type UpdateMePayload = {
  nickname: string;
  statusMessage?: string | null;
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
  listeningDurationSeconds?: number;
};

export type MusicPowerVote = "UPVOTE" | "DOWNVOTE";

export type MusicPowerResponse = {
  musicPower: number;
  myVote: MusicPowerVote | null;
  targetUserSlug: string;
};
