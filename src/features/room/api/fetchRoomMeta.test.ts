import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { fetchRoomMeta } from "./fetchRoomMeta";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { get: vi.fn() },
}));

describe("fetchRoomMeta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("정규화한 room slug와 AbortSignal로 메타를 조회한다", async () => {
    const signal = new AbortController().signal;
    const roomMeta = {
      slug: "sample-room",
      title: "샘플 방",
      isPublic: true,
      hasPassword: false,
      activeUsersCount: 1,
      tags: [],
    };
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: roomMeta },
    });

    await expect(fetchRoomMeta(" %73ample-room ", signal)).resolves.toEqual(
      roomMeta,
    );
    expect(axiosInstance.get).toHaveBeenCalledWith(
      "/api/v1/rooms/sample-room",
      { signal },
    );
  });
});
