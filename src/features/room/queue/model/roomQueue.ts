import type { PlaylistEntry } from "@/src/features/playlist/model/types";
import type { User } from "@/src/features/user/model/types";

export type QueueTab = "all" | "mine";

export function formatQueueDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function isPendingQueueEntry(entry: PlaylistEntry) {
  return !entry.status.isActive && !entry.status.isPlayed && !entry.status.skipped;
}

export function mergeCurrentEntryWithQueue(
  currentEntry: PlaylistEntry | null | undefined,
  queueEntries: PlaylistEntry[],
) {
  if (!currentEntry) {
    return queueEntries;
  }

  const activeCurrentEntry: PlaylistEntry = {
    ...currentEntry,
    status: {
      ...currentEntry.status,
      isActive: true,
      isPlayed: false,
      skipped: false,
    },
  };

  return [
    activeCurrentEntry,
    ...queueEntries.filter((entry) => entry.entryId !== currentEntry.entryId),
  ];
}

export function getPendingPersonalQueueEntryIds(entries: PlaylistEntry[]) {
  return entries
    .filter(isPendingQueueEntry)
    .map((entry) => entry.entryId);
}

export function isValidPersonalQueueMove(
  movableEntryIds: ReadonlySet<string>,
  movedEntryId: string,
  beforeEntryId: string | null,
) {
  return (
    movableEntryIds.has(movedEntryId) &&
    (beforeEntryId === null || movableEntryIds.has(beforeEntryId))
  );
}

export function isEntryRequestedByUser(
  entry: PlaylistEntry,
  currentUser: User | null | undefined,
) {
  if (!currentUser) {
    return false;
  }

  const requesterSlug = entry.addedBy.slug?.trim();
  return Boolean(requesterSlug && requesterSlug === currentUser.slug);
}
