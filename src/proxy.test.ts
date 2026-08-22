import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getMaintenanceConfig = vi.hoisted(() => vi.fn());

vi.mock("@/src/shared/config/maintenance/maintenanceConfig", () => ({
  getMaintenanceConfig,
}));

import { config, proxy } from "./proxy";

describe("proxy", () => {
  beforeEach(() => {
    getMaintenanceConfig.mockReset();
  });

  it("점검이 꺼져 있으면 원래 요청을 계속 처리한다", async () => {
    getMaintenanceConfig.mockResolvedValue({ enabled: false });

    const response = await proxy(
      new NextRequest("https://queuing.cc/room/sample"),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("점검이 켜져 있으면 query를 제거하고 점검 페이지로 이동한다", async () => {
    getMaintenanceConfig.mockResolvedValue({ enabled: true });

    const response = await proxy(
      new NextRequest("https://queuing.cc/room/sample?password=secret"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://queuing.cc/maintenance",
    );
  });

  it.each([
    ["https://queuing.cc/home", true],
    ["https://queuing.cc/room/sample", true],
    ["https://queuing.cc/maintenance", false],
    ["https://queuing.cc/api/health", false],
    ["https://queuing.cc/_next/static/app.js", false],
    ["https://queuing.cc/_next/image?url=/qlofile_white.png", false],
    ["https://queuing.cc/icons/home_exit.svg", false],
  ])("matcher가 %s 요청을 예상대로 분류한다", (url, expected) => {
    expect(
      unstable_doesMiddlewareMatch({
        config,
        url,
      }),
    ).toBe(expected);
  });
});
