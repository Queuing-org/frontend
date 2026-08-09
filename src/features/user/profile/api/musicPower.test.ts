import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { fetchMusicPower } from "./fetchMusicPower";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: {
    get: vi.fn(),
  },
}));

const response = {
  musicPower: 12,
  myVote: null,
  targetUserSlug: "target/user",
};

describe("음악력 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("인코딩한 사용자 slug로 음악력을 조회한다", async () => {
    const abortController = new AbortController();
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: response },
    });

    await expect(
      fetchMusicPower("target/user", abortController.signal),
    ).resolves.toEqual(response);
    expect(axiosInstance.get).toHaveBeenCalledWith(
      "/api/v1/user-profiles/target%2Fuser/music-power",
      { signal: abortController.signal },
    );
  });
});
