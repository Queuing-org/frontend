import { describe, expect, it } from "vitest";
import { formatListeningDuration } from "./formatListeningDuration";

describe("formatListeningDuration", () => {
  it.each([
    [undefined, "-"],
    [null, "-"],
    [-1, "-"],
    [Number.NaN, "-"],
    [0, "0분"],
    [59, "1분 미만"],
    [60, "1분"],
    [3_600, "1시간"],
    [14_700, "4시간 5분"],
  ])("%s초를 %s로 표시한다", (seconds, expected) => {
    expect(formatListeningDuration(seconds)).toBe(expected);
  });
});
