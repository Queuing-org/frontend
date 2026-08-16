import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { fetchMusicPower } from "./fetchMusicPower";
import { userKeys } from "@/src/features/user/model/queryKeys";

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
      fetchMusicPower("target/user", undefined, abortController.signal),
    ).resolves.toEqual(response);
    expect(axiosInstance.get).toHaveBeenCalledWith(
      "/api/v1/user-profiles/target%2Fuser/music-power",
      { signal: abortController.signal },
    );
  });

  it("재생 건별 조회에는 roomSlug와 entryId를 query로 함께 보낸다", async () => {
    const abortController = new AbortController();
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: { ...response, myVote: "DOWNVOTE" } },
    });

    await fetchMusicPower(
      "target/user",
      { roomSlug: "room-a", entryId: "entry-1" },
      abortController.signal,
    );

    expect(axiosInstance.get).toHaveBeenCalledWith(
      "/api/v1/user-profiles/target%2Fuser/music-power",
      {
        params: { roomSlug: "room-a", entryId: "entry-1" },
        signal: abortController.signal,
      },
    );
  });

  it("room과 entry가 다른 조회는 서로 다른 query key를 사용한다", () => {
    expect(userKeys.musicPower("target", "room-a", "entry-1")).not.toEqual(
      userKeys.musicPower("target", "room-a", "entry-2"),
    );
    expect(userKeys.musicPower("target", "room-a", "entry-1")).not.toEqual(
      userKeys.musicPower("target", "room-b", "entry-1"),
    );
  });
});
