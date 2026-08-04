import { describe, expect, it } from "vitest";
import type { PlaylistEntry } from "./types";
import { applyPendingEntryOrder, type RoomQueueData } from "./queueOrderOptimistic";

const entry = (entryId: string, ownerOrderLocked: boolean): PlaylistEntry => ({
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
    ownerOrderLocked,
  },
  addedBy: { slug: "me", nickname: "나", avatarUrl: null },
  entryId,
  createdAtMs: 1,
  updatedAtMs: 1,
});

describe("queueOrderOptimistic", () => {
  it("개인 자유 구간만 재정렬하면 고정곡 위치와 페이지 구조를 보존한다", () => {
    const data: RoomQueueData = {
      pages: [
        {
          items: [entry("locked", true), entry("a", false)],
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
      pageParams: [null, { cursor: "a", queueRevision: 1 }],
    };

    const result = applyPendingEntryOrder(data, ["b", "a"]);
    expect(result?.pages.map((page) => page.items.map((item) => item.entryId)))
      .toEqual([["locked", "b"], ["a"]]);
    expect(result?.pages[0]?.items[0]?.status.ownerOrderLocked).toBe(true);
  });
});
