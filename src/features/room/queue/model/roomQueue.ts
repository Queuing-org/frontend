import type { PlaylistEntry } from "@/src/features/playlist/model/types";
import type { User } from "@/src/features/user/model/types";

export type QueueTab = "all" | "mine";
export type QueueEntryStatusTone = "active" | "played" | "queued" | "skipped";

export function formatQueueDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function getQueueEntryStatus(entry: PlaylistEntry): {
  label: string;
  tone: QueueEntryStatusTone;
} {
  if (entry.status.isActive) {
    return { label: "재생 중", tone: "active" };
  }

  if (entry.status.skipped) {
    return { label: "건너뜀", tone: "skipped" };
  }

  if (entry.status.isPlayed) {
    return { label: "재생 완료", tone: "played" };
  }

  return { label: "대기 중", tone: "queued" };
}

export function isPendingQueueEntry(entry: PlaylistEntry) {
  return !entry.status.isActive && !entry.status.isPlayed && !entry.status.skipped;
}

export function isEntryRequestedByUser(
  entry: PlaylistEntry,
  currentUser: User | null | undefined,
) {
  if (!currentUser) {
    return false;
  }

  const requesterSlug = entry.addedBy.slug?.trim();
  if (requesterSlug) {
    return requesterSlug === currentUser.slug;
  }

  if (
    typeof currentUser.userId === "number" &&
    typeof entry.addedBy.userId === "number"
  ) {
    return entry.addedBy.userId === currentUser.userId;
  }

  return entry.addedBy.nickname === currentUser.nickname;
}
