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
        code: "too-many-requests",
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
      code: "too-many-requests",
      retryAfterMs: 1000,
    });
  });

  it("중첩 error의 fieldErrors를 보존한다", async () => {
    axiosInstance.defaults.adapter = vi.fn(async (config) => {
      const response: AxiosResponse = {
        config,
        data: {
          error: {
            statusCode: 400,
            code: "validation-failed",
            message: "입력값을 확인해 주세요.",
            fieldErrors: [
              { field: "nickname", reason: "2자 이상이어야 해요." },
            ],
          },
        },
        headers: new AxiosHeaders(),
        status: 400,
        statusText: "Bad Request",
      };
      throw new AxiosError(
        "Request failed with status code 400",
        "ERR_BAD_REQUEST",
        config,
        undefined,
        response,
      );
    });

    const error = await axiosInstance.get("/invalid").catch((value) => value);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: "validation-failed",
      message: "입력값을 확인해 주세요.",
      fieldErrors: [
        { field: "nickname", reason: "2자 이상이어야 해요." },
      ],
    });
  });

  it("빈 fieldErrors는 생략하고 top-level 오류 필드는 백엔드 계약으로 해석하지 않는다", async () => {
    axiosInstance.defaults.adapter = vi.fn(async (config) => {
      const response: AxiosResponse = {
        config,
        data: {
          statusCode: 403,
          code: "legacy-error",
          message: "legacy message",
          fieldErrors: [],
        },
        headers: new AxiosHeaders(),
        status: 404,
        statusText: "Not Found",
      };
      throw new AxiosError(
        "Request failed with status code 404",
        "ERR_BAD_REQUEST",
        config,
        undefined,
        response,
      );
    });

    const error = await axiosInstance.get("/legacy").catch((value) => value);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 404,
      message: "Request failed with status code 404",
    });
    expect(error.code).toBeUndefined();
    expect(error.fieldErrors).toBeUndefined();
  });

  it("응답 본문이 비어 있으면 HTTP status와 Axios 기본 메시지를 사용한다", async () => {
    axiosInstance.defaults.adapter = vi.fn(async (config) => {
      const response: AxiosResponse = {
        config,
        data: undefined,
        headers: new AxiosHeaders(),
        status: 502,
        statusText: "Bad Gateway",
      };
      throw new AxiosError(
        "Request failed with status code 502",
        "ERR_BAD_RESPONSE",
        config,
        undefined,
        response,
      );
    });

    const error = await axiosInstance.get("/empty").catch((value) => value);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 502,
      message: "Request failed with status code 502",
    });
    expect(error.fieldErrors).toBeUndefined();
  });
});
