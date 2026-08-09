import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { fetchRoomChats } from "./fetchRoomChats";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { get: vi.fn() },
}));

vi.mock("@/src/shared/api/roomPasswordHeaders", () => ({
  buildRoomPasswordHeaders: vi.fn((password?: string | null) =>
    password ? { "X-Room-Password": password } : undefined,
  ),
}));

describe("fetchRoomChats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cursor history GET에 AbortSignal을 전달한다", async () => {
    const response = { hasNext: false, items: [], nextCursor: null };
    const abortController = new AbortController();
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: response },
    });

    await expect(
      fetchRoomChats({
        cursorId: 42,
        password: "secret",
        signal: abortController.signal,
        size: 100,
        slug: "room slug",
      }),
    ).resolves.toEqual(response);

    expect(axiosInstance.get).toHaveBeenCalledWith(
      "/api/v1/rooms/room%20slug/chats",
      {
        headers: { "X-Room-Password": "secret" },
        params: { cursorId: 42, size: 100 },
        signal: abortController.signal,
      },
    );
  });
});
