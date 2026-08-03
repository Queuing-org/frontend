import { describe, expect, it } from "vitest";
import type { PlaylistEntry } from "@/src/features/playlist/model/types";
import {
  getMovablePersonalQueueEntryIds,
  isEntryRequestedByUser,
  isValidPersonalQueueMove,
} from "./roomQueue";

const entry = (
  entryId: string,
  ownerOrderLocked: boolean,
  slug: string | null = "me",
): PlaylistEntry => ({
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
  addedBy: { slug, nickname: "같은닉네임", avatarUrl: null },
  entryId,
  createdAtMs: 1,
  updatedAtMs: 1,
});

describe("개인 큐 순서와 공개 식별", () => {
  it("고정되지 않은 대기곡만 개인 순서 payload 후보에 포함한다", () => {
    const ids = getMovablePersonalQueueEntryIds([
      entry("locked", true),
      entry("a", false),
      entry("b", false),
    ]);
    expect(ids).toEqual(["a", "b"]);
    expect(isValidPersonalQueueMove(new Set(ids), "a", "b")).toBe(true);
    expect(isValidPersonalQueueMove(new Set(ids), "locked", "b")).toBe(false);
    expect(isValidPersonalQueueMove(new Set(ids), "a", "locked")).toBe(false);
  });

  it("닉네임이 같아도 addedBy.slug가 없으면 본인 곡으로 보지 않는다", () => {
    const me = {
      slug: "me",
      nickname: "같은닉네임",
      profileImageUrl: null,
      userId: 1,
    };
    expect(isEntryRequestedByUser(entry("mine", false), me)).toBe(true);
    expect(isEntryRequestedByUser(entry("guest", false, null), me)).toBe(false);
  });
});
