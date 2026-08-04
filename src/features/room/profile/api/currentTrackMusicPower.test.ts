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
});
