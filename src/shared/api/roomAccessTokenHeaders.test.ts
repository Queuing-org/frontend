import { describe, expect, it } from "vitest";
import { buildRoomAccessTokenHeaders } from "./roomAccessTokenHeaders";

describe("buildRoomAccessTokenHeaders", () => {
  it("정규화한 접근 토큰만 native/HTTP 공통 헤더로 만든다", () => {
    expect(buildRoomAccessTokenHeaders(" access-token ")).toEqual({
      "X-Room-Access-Token": "access-token",
    });
    expect(buildRoomAccessTokenHeaders(" ")).toBeUndefined();
    expect(buildRoomAccessTokenHeaders(null)).toBeUndefined();
  });
});
