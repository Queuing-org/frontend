import { describe, expect, it } from "vitest";
import {
  MAX_ROOM_TAG_FILTERS,
  normalizeRoomTagSlugs,
} from "./roomTagFilters";

describe("normalizeRoomTagSlugs", () => {
  it("공백과 중복을 제거하고 안정적인 순서로 정규화한다", () => {
    expect(normalizeRoomTagSlugs([" kpop ", "anime", "kpop", ""])).toEqual([
      "anime",
      "kpop",
    ]);
  });

  it("서버 계약에 맞춰 최대 3개까지만 유지한다", () => {
    expect(MAX_ROOM_TAG_FILTERS).toBe(3);
    expect(
      normalizeRoomTagSlugs(["rock", "kpop", "anime", "jazz"]),
    ).toEqual(["anime", "kpop", "rock"]);
  });
});
