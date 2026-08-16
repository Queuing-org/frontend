import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { setCurrentTrackMusicPowerVote } from "./setCurrentTrackMusicPowerVote";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: {
    put: vi.fn(),
  },
}));

vi.mock("@/src/shared/api/roomPasswordHeaders", () => ({
  buildRoomPasswordHeaders: vi.fn(() => ({
    "X-Room-Password": "secret",
  })),
}));

const response = {
  musicPower: 8,
  myVote: "UPVOTE" as const,
  targetUserSlug: "requester",
};

describe("현재 곡 신청자 음악력 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("현재 신청자와 방·재생 항목 기준 PUT에 vote를 전송한다", async () => {
    vi.mocked(axiosInstance.put).mockResolvedValue({
      data: { result: response },
    });

    await expect(
      setCurrentTrackMusicPowerVote({
        entryId: "entry-1",
        roomSlug: "room-a",
        targetUserSlug: "requester/user",
        vote: "UPVOTE",
      }),
    ).resolves.toEqual(response);

    expect(axiosInstance.put).toHaveBeenCalledWith(
      "/api/v1/user-profiles/requester%2Fuser/music-power",
      { entryId: "entry-1", roomSlug: "room-a", vote: "UPVOTE" },
    );
  });
});
