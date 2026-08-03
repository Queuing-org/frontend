import type { InfiniteData } from "@tanstack/react-query";
import type { RoomQueuePage, RoomQueuePageParam } from "./types";

export type RoomQueueData = InfiniteData<
  RoomQueuePage,
  RoomQueuePageParam | null
>;

export type QueueOrderSnapshot = [readonly unknown[], RoomQueueData | undefined];

export function applyPendingEntryOrder(
  currentData: RoomQueueData | undefined,
  orderedPendingEntryIds: string[],
) {
  if (!currentData || orderedPendingEntryIds.length < 2) {
    return currentData;
  }

  const currentEntries = currentData.pages.flatMap((page) => page.items);

  const orderedEntriesById = new Map(
    currentEntries
      .filter((entry) => orderedPendingEntryIds.includes(entry.entryId))
      .map((entry) => [entry.entryId, entry]),
  );
  const reorderedEntries = orderedPendingEntryIds
    .map((entryId) => orderedEntriesById.get(entryId))
    .filter((entry) => !!entry);

  if (reorderedEntries.length !== orderedPendingEntryIds.length) {
    return currentData;
  }

  let reorderedIndex = 0;

  const nextEntries = currentEntries.map((entry) => {
    if (!orderedEntriesById.has(entry.entryId)) {
      return entry;
    }

    const reorderedEntry = reorderedEntries[reorderedIndex];
    reorderedIndex += 1;

    return reorderedEntry ?? entry;
  });

  let nextEntryIndex = 0;
  return {
    ...currentData,
    pages: currentData.pages.map((page) => ({
      ...page,
      items: page.items.map(() => {
        const entry = nextEntries[nextEntryIndex];
        nextEntryIndex += 1;
        return entry;
      }),
    })),
  };
}

export function removeQueueEntries(
  currentData: RoomQueueData | undefined,
  entryIds: ReadonlySet<string>,
) {
  if (!currentData) {
    return currentData;
  }

  const removedCount = currentData.pages.reduce(
    (count, page) =>
      count + page.items.filter((entry) => entryIds.has(entry.entryId)).length,
    0,
  );

  return {
    ...currentData,
    pages: currentData.pages.map((page) => ({
      ...page,
      items: page.items.filter((entry) => !entryIds.has(entry.entryId)),
      totalPendingCount: Math.max(0, page.totalPendingCount - removedCount),
    })),
  };
}
