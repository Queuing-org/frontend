import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { fetchRoomParticipantsPage } from "./fetchRoomParticipants";
import { fetchRoomPlayback } from "./fetchRoomPlayback";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { get: vi.fn() },
}));

vi.mock("@/src/shared/api/roomPasswordHeaders", () => ({
  buildRoomPasswordHeaders: vi.fn((password?: string | null) =>
    password ? { "X-Room-Password": password } : undefined,
  ),
}));

describe("room playback/participants request cancellation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("playback GET에 AbortSignal을 전달한다", async () => {
    const signal = new AbortController().signal;
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: { queueRevision: 1 } },
    });

    await fetchRoomPlayback({ slug: "room", password: "secret", signal });

    expect(axiosInstance.get).toHaveBeenCalledWith(
      "/api/v1/rooms/room/playback",
      {
        headers: { "X-Room-Password": "secret" },
        signal,
      },
    );
  });

  it("participant cursor page GET에 AbortSignal을 전달한다", async () => {
    const signal = new AbortController().signal;
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({
        data: {
          result: {
            items: [],
            hasNext: false,
            nextCursor: null,
          },
        },
      });

    await fetchRoomParticipantsPage({
      slug: "room",
      password: "secret",
      cursor: "next",
      signal,
    });

    expect(axiosInstance.get).toHaveBeenCalledTimes(1);
    expect(axiosInstance.get).toHaveBeenCalledWith(
      "/api/v1/rooms/room/participants",
      {
        params: { cursor: "next", size: 100 },
        headers: { "X-Room-Password": "secret" },
        signal,
      },
    );
  });
});
