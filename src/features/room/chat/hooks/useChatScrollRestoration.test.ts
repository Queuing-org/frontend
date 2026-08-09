import { describe, expect, it } from "vitest";
import { getLeadingMessageRemovalOffset } from "./useChatScrollRestoration";

describe("chat window scroll anchor", () => {
  it("앞 message가 window에서 빠지면 기존 offset만큼 scroll 위치를 보정한다", () => {
    expect(
      getLeadingMessageRemovalOffset(
        ["a", "b", "c", "d"],
        "c",
        new Map([
          ["a", 16],
          ["b", 80],
          ["c", 152],
          ["d", 220],
        ]),
      ),
    ).toBe(136);
  });

  it("prepend나 전체 교체처럼 이전 layout에 없는 첫 message는 임의 보정하지 않는다", () => {
    expect(
      getLeadingMessageRemovalOffset(
        ["b", "c"],
        "older-a",
        new Map([
          ["b", 16],
          ["c", 80],
        ]),
      ),
    ).toBe(0);
  });
});
