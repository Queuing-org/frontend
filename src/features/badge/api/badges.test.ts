import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { fetchBadges } from "./fetchBadges";
import { fetchMyBadges } from "./fetchMyBadges";
import { clearRepresentativeBadge } from "./clearRepresentativeBadge";
import { updateRepresentativeBadge } from "./updateRepresentativeBadge";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("칭호 API 계약", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("카탈로그의 badgeCode/tier/active/acquired 응답을 유지한다", async () => {
    const response = {
      badges: [
        {
          badgeCode: "ROOM_CREATE_00001",
          name: "방 팠음",
          description: "설명",
          category: "ROOM_CREATION",
          tier: "TIER_1",
          acquisitionHint: "방을 만들어보세요.",
          active: true,
          acquired: false,
        },
      ],
    };
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: response },
    });

    await expect(fetchBadges()).resolves.toEqual(response);
    expect(axiosInstance.get).toHaveBeenCalledWith("/api/v1/badges");
  });

  it("획득 칭호의 representative/acquiredAt과 대표 badgeCode를 파싱한다", async () => {
    const response = {
      badges: [
        {
          badgeCode: "ROOM_CREATE_00001",
          name: "방 팠음",
          description: "설명",
          category: "ROOM_CREATION",
          acquired: true as const,
          acquiredAt: "2026-07-29T00:00:00.000Z",
          representative: true,
        },
      ],
      representativeBadge: {
        badgeCode: "ROOM_CREATE_00001",
        name: "방 팠음",
      },
    };
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: response },
    });

    await expect(fetchMyBadges()).resolves.toEqual(response);
    expect(axiosInstance.get).toHaveBeenCalledWith(
      "/api/v1/users/me/badges",
    );
  });

  it("대표 칭호 설정 payload는 badgeCode만 전송한다", async () => {
    vi.mocked(axiosInstance.put).mockResolvedValue({ data: { result: null } });

    await updateRepresentativeBadge({ badgeCode: "ROOM_CREATE_00001" });

    expect(axiosInstance.put).toHaveBeenCalledWith(
      "/api/v1/users/me/badges/representative",
      { badgeCode: "ROOM_CREATE_00001" },
    );
  });

  it("대표 칭호를 동일 경로 DELETE로 해제한다", async () => {
    vi.mocked(axiosInstance.delete).mockResolvedValue({
      data: { result: true },
    });

    await expect(clearRepresentativeBadge()).resolves.toBe(true);
    expect(axiosInstance.delete).toHaveBeenCalledWith(
      "/api/v1/users/me/badges/representative",
    );
  });

  it("대표 칭호 해제 result가 false면 실패로 처리한다", async () => {
    vi.mocked(axiosInstance.delete).mockResolvedValue({
      data: { result: false },
    });

    await expect(clearRepresentativeBadge()).rejects.toThrow(
      "대표 칭호를 해제하지 못했습니다.",
    );
  });
});
