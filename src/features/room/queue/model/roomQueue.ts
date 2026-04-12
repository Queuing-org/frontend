import type { PlaylistEntry } from "@/src/entities/playlist/model/types";
import type { User } from "@/src/entities/user/model/types";

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

export function isEntryRequestedByUser(
  entry: PlaylistEntry,
  currentUser: User | null | undefined,
) {
  if (!currentUser) {
    return false;
  }

  if (typeof currentUser.userId === "number") {
    return entry.addedBy.userId === currentUser.userId;
  }

  return entry.addedBy.nickname === currentUser.nickname;
}
