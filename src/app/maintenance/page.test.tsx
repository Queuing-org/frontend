import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const getMaintenanceConfig = vi.hoisted(() => vi.fn());

vi.mock("next/image", () => ({
  default: () => <span aria-hidden="true" />,
}));

vi.mock(
  "@/src/shared/config/maintenance/maintenanceConfig",
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import("@/src/shared/config/maintenance/maintenanceConfig")
    >();

    return {
      ...actual,
      getMaintenanceConfig,
    };
  },
);

import MaintenancePage from "./page";

describe("MaintenancePage", () => {
  it("Edge Config 점검 시간과 안내 문구를 표시한다", async () => {
    getMaintenanceConfig.mockResolvedValue({
      enabled: true,
      startsAt: "2026-08-22T22:00:00+09:00",
      endsAt: "2026-08-22T23:30:00+09:00",
      message: "안정적인 서비스를 위해 서버를 점검하고 있습니다.",
    });

    render(await MaintenancePage());

    expect(
      screen.getByRole("heading", { name: "서버 점검 중입니다." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("8월 22일 (토) 22:00 ~ 23:30"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("안정적인 서비스를 위해 서버를 점검하고 있습니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("이용에 불편을 드려 죄송합니다."),
    ).toBeInTheDocument();
    expect(screen.queryByText("양해해 주셔서 감사합니다.")).toBeNull();
    expect(
      screen.getByRole("link", { name: "서비스 상태 다시 확인" }),
    ).toHaveAttribute("href", "/");
  });

  it("시간이 없으면 일반 점검 안내를 표시한다", async () => {
    getMaintenanceConfig.mockResolvedValue({
      enabled: true,
      startsAt: null,
      endsAt: null,
      message: null,
    });

    render(await MaintenancePage());

    expect(
      screen.getByText("현재 서버 점검을 진행하고 있습니다."),
    ).toBeInTheDocument();
  });
});
