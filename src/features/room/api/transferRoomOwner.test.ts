import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { transferRoomOwner } from "./transferRoomOwner";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { patch: vi.fn() },
}));

describe("transferRoomOwner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("정규화한 방과 회원 slug로 방장 위임 요청을 보낸다", async () => {
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: { result: true },
    });

    await expect(
      transferRoomOwner({
        accessToken: "secret",
        slug: " rooms/sample ",
        userSlug: " new-owner ",
      }),
    ).resolves.toBe(true);

    expect(axiosInstance.patch).toHaveBeenCalledWith(
      "/api/v1/rooms/rooms%2Fsample/owner",
      { userSlug: "new-owner" },
      { headers: { "X-Room-Access-Token": "secret" } },
    );
  });

  it("빈 회원 slug는 네트워크 요청 전에 거부한다", async () => {
    await expect(
      transferRoomOwner({
        accessToken: "secret",
        slug: "room",
        userSlug: "   ",
      }),
    ).rejects.toMatchObject({
      message: "새 방장 식별자가 올바르지 않습니다.",
      status: 400,
    });
    expect(axiosInstance.patch).not.toHaveBeenCalled();
  });

  it("false 성공 응답은 계약 오류로 처리한다", async () => {
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: { result: false },
    });

    await expect(
      transferRoomOwner({
        accessToken: "secret",
        slug: "room",
        userSlug: "new-owner",
      }),
    ).rejects.toMatchObject({ message: "방장을 위임하지 못했습니다." });
  });
});
