import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { fetchRooms } from "./fetchRooms";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { get: vi.fn() },
}));

describe("fetchRooms v26.8 cursor", () => {
  beforeEach(() => vi.clearAllMocks());

  it("대응하는 cursor 필드만 보내고 legacy lastId는 보내지 않는다", async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: { rooms: [], hasNext: false } },
    });

    await fetchRooms({
      cursorSeed: 7,
      cursorLastId: 9,
      cursorLastCreatedAt: "2026-08-02T00:00:00Z",
      cursorLastRandomRank: 0.5,
      cursorLastParticipantCount: 3,
      size: 30,
      ...({ lastId: 99 } as Record<string, number>),
    });

    expect(axiosInstance.get).toHaveBeenCalledWith("/api/v1/rooms", {
      params: {
        cursorSeed: 7,
        cursorLastId: 9,
        cursorLastCreatedAt: "2026-08-02T00:00:00Z",
        cursorLastRandomRank: 0.5,
        cursorLastParticipantCount: 3,
        size: 30,
      },
    });
  });
});
