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
      "/api/v1/user-profiles/me/blocked-users",
      { params: { size: 20 } },
    );
  });

  it("다음 목록은 nextCursor를 lastId로 보낸다", async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: { hasNext: false, items: [], nextCursor: null } },
    });

    await fetchBlockedUsers({ lastId: 287, size: 20 });

    expect(axiosInstance.get).toHaveBeenCalledWith(
      "/api/v1/user-profiles/me/blocked-users",
      { params: { lastId: 287, size: 20 } },
    );
  });

  it("인코딩한 slug로 차단 해제 204 요청을 보낸다", async () => {
    vi.mocked(axiosInstance.delete).mockResolvedValue({
      data: { result: true },
    });

    await expect(unblockUser("target/user")).resolves.toBeUndefined();
    expect(axiosInstance.delete).toHaveBeenCalledWith(
      "/api/v1/user-profiles/me/blocked-users/target%2Fuser",
    );
  });

  it("차단 해제 응답 body는 파싱하지 않는다", async () => {
    vi.mocked(axiosInstance.delete).mockResolvedValue({
      data: { result: false },
    });

    await expect(unblockUser("target-user")).resolves.toBeUndefined();
  });
});
