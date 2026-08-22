import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const edgeConfigMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  get: vi.fn(),
}));

vi.mock("@vercel/edge-config", () => ({
  createClient: edgeConfigMocks.createClient,
}));

import {
  formatMaintenanceWindow,
  getMaintenanceConfig,
  parseMaintenanceConfig,
} from "./maintenanceConfig";

describe("maintenanceConfig", () => {
  beforeEach(() => {
    edgeConfigMocks.createClient.mockReset();
    edgeConfigMocks.get.mockReset();
    edgeConfigMocks.createClient.mockReturnValue({
      get: edgeConfigMocks.get,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("Edge Config 연결이 없으면 정상 서비스를 유지한다", async () => {
    vi.stubEnv("EDGE_CONFIG", "");

    await expect(getMaintenanceConfig()).resolves.toEqual({
      enabled: false,
      startsAt: null,
      endsAt: null,
      message: null,
    });
    expect(edgeConfigMocks.createClient).not.toHaveBeenCalled();
  });

  it("점검 객체를 읽어 활성화 여부와 표시 정보를 보존한다", async () => {
    vi.stubEnv("EDGE_CONFIG", "https://edge-config.example.com/config");
    edgeConfigMocks.get.mockResolvedValue({
      enabled: true,
      startsAt: "2026-08-22T22:00:00+09:00",
      endsAt: "2026-08-22T23:30:00+09:00",
      message: " 안정적인 서비스를 위해 점검하고 있습니다. ",
    });

    await expect(getMaintenanceConfig()).resolves.toEqual({
      enabled: true,
      startsAt: "2026-08-22T22:00:00+09:00",
      endsAt: "2026-08-22T23:30:00+09:00",
      message: "안정적인 서비스를 위해 점검하고 있습니다.",
    });
    expect(edgeConfigMocks.createClient).toHaveBeenCalledWith(
      "https://edge-config.example.com/config",
      { staleIfError: false },
    );
    expect(edgeConfigMocks.get).toHaveBeenCalledWith("maintenance");
  });

  it("잘못된 시간 구간은 숨기되 활성화된 점검 차단은 유지한다", () => {
    expect(
      parseMaintenanceConfig({
        enabled: true,
        startsAt: "2026-08-22T23:00:00+09:00",
        endsAt: "2026-08-22T22:00:00+09:00",
      }),
    ).toEqual({
      enabled: true,
      startsAt: null,
      endsAt: null,
      message: null,
    });
  });

  it("Edge Config 조회 실패 시 오류 상세를 노출하지 않고 정상 서비스를 유지한다", async () => {
    vi.stubEnv("EDGE_CONFIG", "https://edge-config.example.com/config");
    edgeConfigMocks.get.mockRejectedValue(
      new Error("secret-token이 포함될 수 있는 상세 오류"),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(getMaintenanceConfig()).resolves.toEqual({
      enabled: false,
      startsAt: null,
      endsAt: null,
      message: null,
    });
    expect(errorSpy).toHaveBeenCalledWith(
      "[maintenance] Edge Config 조회에 실패했습니다.",
    );
  });

  it("Production 연결 누락을 민감 정보 없이 한 번 기록하고 정상 서비스를 유지한다", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("EDGE_CONFIG", "");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { getMaintenanceConfig: getFreshMaintenanceConfig } = await import(
      "./maintenanceConfig"
    );

    await expect(getFreshMaintenanceConfig()).resolves.toMatchObject({
      enabled: false,
    });
    await getFreshMaintenanceConfig();

    expect(errorSpy).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalledWith(
      "[maintenance] EDGE_CONFIG 연결이 설정되지 않았습니다.",
    );
  });

  it("Preview 연결 누락은 로그 없이 정상 서비스를 유지한다", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("EDGE_CONFIG", "");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { getMaintenanceConfig: getFreshMaintenanceConfig } = await import(
      "./maintenanceConfig"
    );

    await expect(getFreshMaintenanceConfig()).resolves.toMatchObject({
      enabled: false,
    });

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("같은 날과 날짜 경계 점검 구간을 서울 시간으로 표시한다", () => {
    expect(
      formatMaintenanceWindow({
        startsAt: "2026-08-22T22:00:00+09:00",
        endsAt: "2026-08-22T23:30:00+09:00",
      }),
    ).toBe("8월 22일 (토) 22:00 ~ 23:30");

    expect(
      formatMaintenanceWindow({
        startsAt: "2026-08-22T23:00:00+09:00",
        endsAt: "2026-08-23T01:00:00+09:00",
      }),
    ).toBe("8월 22일 (토) 23:00 ~ 8월 23일 (일) 01:00");
  });
});
