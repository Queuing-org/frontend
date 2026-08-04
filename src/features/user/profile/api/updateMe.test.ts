import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { updateMe } from "./updateMe";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: {
    patch: vi.fn(),
  },
}));

describe("내 프로필 수정 API 계약", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("필수 nickname과 의도한 statusMessage를 보내고 boolean 결과를 반환한다", async () => {
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: { result: true },
    });

    await expect(
      updateMe({ nickname: "민지", statusMessage: "좋은 음악과 함께" }),
    ).resolves.toBe(true);
    expect(axiosInstance.patch).toHaveBeenCalledWith(
      "/api/v1/user-profiles/me",
      { nickname: "민지", statusMessage: "좋은 음악과 함께" },
    );
  });
});
