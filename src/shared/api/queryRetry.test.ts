import { describe, expect, it } from "vitest";
import { ApiError } from "./api-error";
import { shouldRetryQuery } from "./queryRetry";

describe("shouldRetryQuery", () => {
  it("network/5xx 조회는 최대 세 번 재시도한다", () => {
    expect(shouldRetryQuery(0, new Error("network"))).toBe(true);
    expect(
      shouldRetryQuery(
        2,
        new ApiError({ status: 503, message: "unavailable" }),
      ),
    ).toBe(true);
    expect(
      shouldRetryQuery(
        3,
        new ApiError({ status: 503, message: "unavailable" }),
      ),
    ).toBe(false);
  });

  it("일반 4xx와 axios에서 소진된 429는 React Query에서 재시도하지 않는다", () => {
    expect(
      shouldRetryQuery(
        0,
        new ApiError({ status: 404, message: "not found" }),
      ),
    ).toBe(false);
    expect(
      shouldRetryQuery(
        0,
        new ApiError({ status: 429, message: "rate limited" }),
      ),
    ).toBe(false);
  });
});
