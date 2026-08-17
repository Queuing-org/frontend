import { describe, expect, it } from "vitest";
import type { PlaylistEntry } from "./types";
import { applyPendingEntryOrder, type RoomQueueData } from "./queueOrderOptimistic";

const entry = (entryId: string, ownerOrdered: boolean): PlaylistEntry => ({
  order: 1,
  track: {
    title: entryId,
    videoId: entryId,
    provider: "YOUTUBE",
    durationMs: 1,
    thumbnailUrl: null,
  },
  status: {
    skipped: false,
    isActive: false,
    isPlayed: false,
    ownerOrdered,
  },
  addedBy: { slug: "me", nickname: "나", avatarUrl: null },
  entryId,
  createdAtMs: 1,
  updatedAtMs: 1,
});

describe("queueOrderOptimistic", () => {
  it("ownerOrdered 곡을 포함한 개인 pending 전체를 낙관적으로 재정렬한다", () => {
    const data: RoomQueueData = {
      pages: [
        {
          items: [entry("owner-ordered", true), entry("a", false)],
          hasNext: true,
          nextCursor: "a",
          queueRevision: 1,
          totalPendingCount: 3,
        },
        {
          items: [entry("b", false)],
          hasNext: false,
          nextCursor: null,
          queueRevision: 1,
          totalPendingCount: 3,
        },
      ],
      pageParams: [null, "a"],
    };

    const result = applyPendingEntryOrder(data, ["b", "owner-ordered", "a"]);
    expect(result?.pages.map((page) => page.items.map((item) => item.entryId)))
      .toEqual([["b", "owner-ordered"], ["a"]]);
    expect(result?.pages[0]?.items[1]?.status.ownerOrdered).toBe(true);
  });
});
