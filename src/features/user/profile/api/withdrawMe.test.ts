import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { withdrawMe } from "./withdrawMe";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { delete: vi.fn() },
}));

describe("회원 탈퇴 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axiosInstance.delete).mockResolvedValue({ data: { result: true } });
  });

  it("사유를 trim해서 선택 body로 보낸다", async () => {
    await withdrawMe({ reason: "  이용 빈도가 낮아요  " });

    expect(axiosInstance.delete).toHaveBeenCalledWith(
      "/api/v1/user-profiles/me",
      { data: { reason: "이용 빈도가 낮아요" } },
    );
  });

  it.each([undefined, "", "   "])("빈 사유 %p는 요청 body를 생략한다", async (reason) => {
    await withdrawMe({ reason });

    expect(axiosInstance.delete).toHaveBeenLastCalledWith(
      "/api/v1/user-profiles/me",
      undefined,
    );
  });
});
