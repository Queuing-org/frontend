import { describe, expect, it } from "vitest";
import { getChatContentSegments } from "./chatTimestamps";

describe("getChatContentSegments", () => {
  it("분:초와 시:분:초를 텍스트 사이의 타임스탬프로 분리한다", () => {
    expect(getChatContentSegments("인트로 0:07, 하이라이트 1:02:30")).toEqual([
      { text: "인트로 ", type: "text" },
      { seconds: 7, text: "0:07", type: "timestamp" },
      { text: ", 하이라이트 ", type: "text" },
      { seconds: 3_750, text: "1:02:30", type: "timestamp" },
    ]);
  });

  it("초 범위와 시:분:초의 분 범위가 잘못된 값은 일반 텍스트로 둔다", () => {
    expect(getChatContentSegments("12:99 1:72:10")).toEqual([
      { text: "12:99 1:72:10", type: "text" },
    ]);
  });

  it("허용 범위보다 긴 분 표기는 부분 문자열로 오인하지 않는다", () => {
    expect(getChatContentSegments("112:11")).toEqual([
      { text: "112:11", type: "text" },
    ]);
  });
});
