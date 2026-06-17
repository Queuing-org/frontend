import type { RoomQueueResult } from "./types";

export type QueueOrderSnapshot = [readonly unknown[], RoomQueueResult | undefined];

export function applyPendingEntryOrder(
  currentEntries: RoomQueueResult | undefined,
  orderedPendingEntryIds: string[],
) {
  if (!currentEntries || orderedPendingEntryIds.length < 2) {
    return currentEntries;
  }

  const orderedEntriesById = new Map(
    currentEntries
      .filter((entry) => orderedPendingEntryIds.includes(entry.entryId))
      .map((entry) => [entry.entryId, entry]),
  );
  const reorderedEntries = orderedPendingEntryIds
    .map((entryId) => orderedEntriesById.get(entryId))
    .filter((entry) => !!entry);

  if (reorderedEntries.length !== orderedPendingEntryIds.length) {
    return currentEntries;
  }

  let reorderedIndex = 0;

  return currentEntries.map((entry) => {
    if (!orderedEntriesById.has(entry.entryId)) {
      return entry;
    }

    const reorderedEntry = reorderedEntries[reorderedIndex];
    reorderedIndex += 1;

    return reorderedEntry ?? entry;
  });
}
