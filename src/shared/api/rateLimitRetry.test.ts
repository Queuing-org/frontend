import { describe, expect, it } from "vitest";
import {
  getRateLimitRetryDelayMs,
  parseRetryAfterMs,
} from "./rateLimitRetry";

describe("Retry-After 처리", () => {
  it("초 단위 값을 밀리초로 변환한다", () => {
    expect(parseRetryAfterMs("1.5")).toBe(1500);
    expect(parseRetryAfterMs(2)).toBe(2000);
  });

  it("HTTP-date를 현재 시각 기준 대기 시간으로 변환한다", () => {
    const now = Date.parse("2026-07-29T12:00:00.000Z");

    expect(
      parseRetryAfterMs("Wed, 29 Jul 2026 12:00:03 GMT", now),
    ).toBe(3000);
  });

  it("서버 대기 시간과 지수 백오프 중 더 긴 값을 사용한다", () => {
    expect(getRateLimitRetryDelayMs(200, 0)).toBe(500);
    expect(getRateLimitRetryDelayMs(4000, 1)).toBe(4000);
  });
});
