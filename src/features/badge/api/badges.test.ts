import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { fetchMyBadges } from "./fetchMyBadges";
import { fetchPublicUserBadges } from "./fetchPublicUserBadges";
import { clearRepresentativeBadge } from "./clearRepresentativeBadge";
import { updateRepresentativeBadge } from "./updateRepresentativeBadge";
import {
  publicUserBadgesQueryOptions,
  PUBLIC_USER_BADGES_STALE_TIME_MS,
} from "../hooks/usePublicUserBadges";

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

  it("획득 칭호의 representative/acquiredAt과 대표 badgeCode를 파싱한다", async () => {
    const response = {
      badges: [
        {
          badgeCode: "ROOM_CREATE_00001",
          name: "방 팠음",
          acquisitionRate: "12.34",
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

    await expect(fetchMyBadges()).resolves.toEqual({
      ...response,
      badges: [{ ...response.badges[0], acquisitionRate: 12.34 }],
    });
    expect(axiosInstance.get).toHaveBeenCalledWith(
      "/api/v1/user-profiles/me/badges",
    );
  });

  it("두 칭호 GET 응답의 숫자 획득률을 number로 유지한다", async () => {
    const response = {
      badges: [
        {
          badgeCode: "ROOM_CREATE_00001",
          name: "방 팠음",
          acquisitionRate: 42,
          description: "누적 방 생성 1회 달성",
          category: "ROOM_CREATION",
          acquired: true as const,
          acquiredAt: "2026-07-29T00:00:00.000Z",
          representative: false,
        },
      ],
      representativeBadge: null,
      userSlug: "user-slug",
    };
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: response },
    });

    await expect(fetchMyBadges()).resolves.toEqual(response);
    await expect(fetchPublicUserBadges("user-slug")).resolves.toEqual(response);
  });

  it.each(["", "not-a-number", -0.01, 100.01, Number.POSITIVE_INFINITY])(
    "잘못된 획득률 %p는 null로 정규화한다",
    async (acquisitionRate) => {
      vi.mocked(axiosInstance.get).mockResolvedValue({
        data: {
          result: {
            badges: [
              {
                badgeCode: "ROOM_CREATE_00001",
                name: "방 팠음",
                acquisitionRate,
                description: "누적 방 생성 1회 달성",
                category: "ROOM_CREATION",
                acquired: true,
                acquiredAt: "2026-07-29T00:00:00.000Z",
                representative: false,
              },
            ],
            representativeBadge: null,
          },
        },
      });

      await expect(fetchMyBadges()).resolves.toMatchObject({
        badges: [{ acquisitionRate: null }],
      });
    },
  );

  it.each([0, 100])("경계 획득률 %p는 유효한 값으로 유지한다", async (acquisitionRate) => {
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: {
        result: {
          badges: [
            {
              badgeCode: "ROOM_CREATE_00001",
              name: "방 팠음",
              acquisitionRate,
              description: "누적 방 생성 1회 달성",
              category: "ROOM_CREATION",
              acquired: true,
              acquiredAt: "2026-07-29T00:00:00.000Z",
              representative: false,
            },
          ],
          representativeBadge: null,
        },
      },
    });

    await expect(fetchMyBadges()).resolves.toMatchObject({
      badges: [{ acquisitionRate }],
    });
  });

  it("대표 칭호 설정 payload는 badgeCode만 전송한다", async () => {
    const badge = { badgeCode: "ROOM_CREATE_00001", name: "방 팠음" };
    vi.mocked(axiosInstance.put).mockResolvedValue({ data: { result: badge } });

    await expect(updateRepresentativeBadge({ badgeCode: "ROOM_CREATE_00001" })).resolves.toEqual(badge);

    expect(axiosInstance.put).toHaveBeenCalledWith(
      "/api/v1/user-profiles/me/representative-badge",
      { badgeCode: "ROOM_CREATE_00001" },
    );
  });

  it("공개 칭호 조회는 query signal과 5분 freshness를 사용한다", async () => {
    const response = {
      badges: [
        {
          badgeCode: "ROOM_CREATE_00001",
          name: "방 팠음",
          acquisitionRate: "12.34",
          description: "누적 방 생성 1회 달성",
          category: "ROOM_CREATION",
          acquired: true as const,
          acquiredAt: "2026-07-29T00:00:00.000Z",
          representative: false,
        },
      ],
      representativeBadge: null,
    };
    const normalizedResponse = {
      ...response,
      badges: [{ ...response.badges[0], acquisitionRate: 12.34 }],
    };
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: response },
    });
    const abortController = new AbortController();
    const options = publicUserBadgesQueryOptions("user slug");
    const queryFn = options.queryFn;

    expect(options.staleTime).toBe(PUBLIC_USER_BADGES_STALE_TIME_MS);
    if (typeof queryFn !== "function") {
      throw new Error("공개 칭호 queryFn이 없습니다.");
    }

    await expect(
      queryFn({ signal: abortController.signal } as never),
    ).resolves.toEqual(normalizedResponse);
    expect(axiosInstance.get).toHaveBeenCalledWith(
      "/api/v1/user-profiles/user%20slug/badges",
      { signal: abortController.signal },
    );

    await expect(
      fetchPublicUserBadges("user slug", abortController.signal),
    ).resolves.toEqual(normalizedResponse);
  });

  it("대표 칭호를 동일 경로 DELETE로 해제한다", async () => {
    vi.mocked(axiosInstance.delete).mockResolvedValue({
      data: { result: true },
    });

    await expect(clearRepresentativeBadge()).resolves.toBeUndefined();
    expect(axiosInstance.delete).toHaveBeenCalledWith(
      "/api/v1/user-profiles/me/representative-badge",
    );
  });

  it("대표 칭호 해제 204 응답은 body를 파싱하지 않는다", async () => {
    vi.mocked(axiosInstance.delete).mockResolvedValue({
      data: { result: false },
    });

    await expect(clearRepresentativeBadge()).resolves.toBeUndefined();
  });
});
