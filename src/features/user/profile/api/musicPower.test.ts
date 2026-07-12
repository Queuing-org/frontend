import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { fetchMusicPower } from "./fetchMusicPower";
import { recommendMusicPower } from "./recommendMusicPower";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const response = {
  musicPower: 12,
  recommendedByMe: false,
  targetUserSlug: "target/user",
};

describe("음악력 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("인코딩한 사용자 slug로 음악력을 조회한다", async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: response },
    });

    await expect(fetchMusicPower("target/user")).resolves.toEqual(response);
    expect(axiosInstance.get).toHaveBeenCalledWith(
      "/api/v1/user-profiles/target%2Fuser/music-power",
    );
  });

  it("인코딩한 사용자 slug로 음악력을 추천한다", async () => {
    vi.mocked(axiosInstance.post).mockResolvedValue({
      data: { result: { ...response, musicPower: 13, recommendedByMe: true } },
    });

    await recommendMusicPower("target/user");
    expect(axiosInstance.post).toHaveBeenCalledWith(
      "/api/v1/user-profiles/target%2Fuser/music-power",
    );
  });
});
