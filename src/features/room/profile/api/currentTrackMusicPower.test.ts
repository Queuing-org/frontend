import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { cancelCurrentTrackMusicPowerVote } from "./cancelCurrentTrackMusicPowerVote";
import { setCurrentTrackMusicPowerVote } from "./setCurrentTrackMusicPowerVote";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: {
    delete: vi.fn(),
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

  it("PUT에 vote와 방 비밀번호 헤더를 전송한다", async () => {
    vi.mocked(axiosInstance.put).mockResolvedValue({
      data: { result: response },
    });

    await expect(
      setCurrentTrackMusicPowerVote({
        roomSlug: "rooms/sample",
        password: "secret",
        vote: "UPVOTE",
      }),
    ).resolves.toEqual(response);

    expect(axiosInstance.put).toHaveBeenCalledWith(
      "/api/v1/rooms/rooms%2Fsample/current-track/music-power",
      { vote: "UPVOTE" },
      { headers: { "X-Room-Password": "secret" } },
    );
  });

  it("DELETE로 현재 투표를 취소한다", async () => {
    const cancelled = { ...response, myVote: null };
    vi.mocked(axiosInstance.delete).mockResolvedValue({
      data: { result: cancelled },
    });

    await expect(
      cancelCurrentTrackMusicPowerVote({
        roomSlug: "sample",
        password: "secret",
      }),
    ).resolves.toEqual(cancelled);
    expect(axiosInstance.delete).toHaveBeenCalledWith(
      "/api/v1/rooms/sample/current-track/music-power",
      { headers: { "X-Room-Password": "secret" } },
    );
  });
});
