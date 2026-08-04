import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { fetchMusicPower } from "./fetchMusicPower";
import { setMusicPowerVote } from "./setMusicPowerVote";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: {
    get: vi.fn(),
    put: vi.fn(),
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
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: response },
    });

    await expect(fetchMusicPower("target/user")).resolves.toEqual(response);
    expect(axiosInstance.get).toHaveBeenCalledWith(
      "/api/v1/user-profiles/target%2Fuser/music-power",
    );
  });

  it("PUT 요청에 vote만 전송한다", async () => {
    const result = { ...response, musicPower: 13, myVote: "UPVOTE" as const };
    vi.mocked(axiosInstance.put).mockResolvedValue({
      data: { result },
    });

    await expect(
      setMusicPowerVote({ userSlug: "target/user", vote: "UPVOTE" }),
    ).resolves.toEqual(result);
    expect(axiosInstance.put).toHaveBeenCalledWith(
      "/api/v1/user-profiles/target%2Fuser/music-power",
      { vote: "UPVOTE" },
    );
  });
});
