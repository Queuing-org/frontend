import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./api-error";
import { axiosInstance } from "./axiosInstance";

function rateLimitError(
  config: InternalAxiosRequestConfig,
  retryAfter = "0",
) {
  const response: AxiosResponse = {
    config,
    data: {
      error: {
        statusCode: 429,
        code: "rate-limit.exceeded",
        message: "요청이 너무 많아요.",
      },
    },
    headers: new AxiosHeaders({ "retry-after": retryAfter }),
    status: 429,
    statusText: "Too Many Requests",
  };

  return new AxiosError(
    "rate limited",
    "ERR_BAD_REQUEST",
    config,
    undefined,
    response,
  );
}

describe("axios 429 재시도", () => {
  const originalAdapter = axiosInstance.defaults.adapter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    axiosInstance.defaults.adapter = originalAdapter;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("GET 429만 최대 두 번 재시도한다", async () => {
    let calls = 0;
    axiosInstance.defaults.adapter = vi.fn(async (config) => {
      calls += 1;
      if (calls <= 2) {
        throw rateLimitError(config);
      }

      return {
        config,
        data: { result: "ok" },
        headers: new AxiosHeaders(),
        status: 200,
        statusText: "OK",
      };
    });

    const request = axiosInstance.get("/rate-limited");
    await vi.runAllTimersAsync();

    await expect(request).resolves.toMatchObject({ data: { result: "ok" } });
    expect(calls).toBe(3);
  });

  it("mutation 429는 재시도하지 않고 retryAfterMs를 노출한다", async () => {
    let calls = 0;
    axiosInstance.defaults.adapter = vi.fn(async (config) => {
      calls += 1;
      throw rateLimitError(config, "1");
    });

    const error = await axiosInstance.put("/rate-limited", {}).catch((value) => value);

    expect(calls).toBe(1);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 429,
      code: "rate-limit.exceeded",
      retryAfterMs: 1000,
    });
  });
});
