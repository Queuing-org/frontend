import { describe, expect, it } from "vitest";
import { classifyTrackInput, highlightTitle } from "./trackSuggestions";

describe("track input", () => {
  it.each([
    ["  ", "frequent"],
    ["  아이유 좋은 날  ", "search"],
    ["https://youtu.be/abc", "url"],
    ["https://youtube.com/playlist?list=abc", "url"],
    ["https://youtube.com/watch", "invalid-url"],
    ["youtu.be/", "invalid-url"],
    ["https://broken", "invalid-url"],
    ["x".repeat(101), "too-long"],
  ])("%s → %s", (input, kind) =>
    expect(classifyTrackInput(input).kind).toBe(kind),
  );
  it("공백을 제거하고 일치한 부분만 강조한다", () => {
    expect(classifyTrackInput("  좋은 날  ").query).toBe("좋은 날");
    expect(highlightTitle("IU 좋은 날 IU", "iu")).toEqual([
      { text: "IU", match: true },
      { text: " 좋은 날 ", match: false },
      { text: "IU", match: true },
    ]);
  });
});
