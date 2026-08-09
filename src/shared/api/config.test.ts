import { afterEach, describe, expect, it, vi } from "vitest";

describe("API 주소 설정", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("환경 변수가 없으면 queuing.cc 주소를 사용한다", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_WS_URL", "");

    const config = await import("./config");

    expect(config.API_BASE_URL).toBe("https://api.queuing.cc");
    expect(config.WEB_SOCKET_URL).toBe("wss://api.queuing.cc/ws");
  });

  it("명시한 환경 변수는 기본값보다 우선한다", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com");
    vi.stubEnv("NEXT_PUBLIC_WS_URL", "wss://api.example.com/ws");

    const config = await import("./config");

    expect(config.API_BASE_URL).toBe("https://api.example.com");
    expect(config.WEB_SOCKET_URL).toBe("wss://api.example.com/ws");
  });
});
