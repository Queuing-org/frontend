import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { fetchBlockedUsers } from "./fetchBlockedUsers";
import { unblockUser } from "./unblockUser";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { delete: vi.fn(), get: vi.fn() },
}));

describe("blocked users API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("첫 목록은 size만 보내고 응답을 푼다", async () => {
    const result = {
      hasNext: true,
      items: [
        {
          blockedAt: "2026-07-10T00:00:00.000Z",
          cursorId: 300,
          nickname: "민지",
          profileImageUrl: null,
          slug: "minji",
        },
      ],
      nextCursor: 287,
    };
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: { result } });

    await expect(fetchBlockedUsers()).resolves.toEqual(result);
    expect(axiosInstance.get).toHaveBeenCalledWith(
      "/api/v1/user-profiles/me/blocks",
      { params: { size: 20 } },
    );
  });

  it("다음 목록은 nextCursor를 lastId로 보낸다", async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: { hasNext: false, items: [], nextCursor: null } },
    });

    await fetchBlockedUsers({ lastId: 287, size: 20 });

    expect(axiosInstance.get).toHaveBeenCalledWith(
      "/api/v1/user-profiles/me/blocks",
      { params: { lastId: 287, size: 20 } },
    );
  });

  it("인코딩한 slug로 차단 해제하고 true 결과를 검증한다", async () => {
    vi.mocked(axiosInstance.delete).mockResolvedValue({
      data: { result: true },
    });

    await expect(unblockUser("target/user")).resolves.toBe(true);
    expect(axiosInstance.delete).toHaveBeenCalledWith(
      "/api/v1/user-profiles/target%2Fuser/blocks",
    );
  });

  it("차단 해제 응답이 false면 실패로 처리한다", async () => {
    vi.mocked(axiosInstance.delete).mockResolvedValue({
      data: { result: false },
    });

    await expect(unblockUser("target-user")).rejects.toMatchObject({
      message: "차단을 해제하지 못했습니다.",
    });
  });
});
