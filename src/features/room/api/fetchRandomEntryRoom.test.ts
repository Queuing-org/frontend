import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { fetchRandomEntryRoom } from "./fetchRandomEntryRoom";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { get: vi.fn() },
}));

describe("fetchRandomEntryRoom", () => {
  beforeEach(() => vi.clearAllMocks());

  it("새 random endpoint에서 result.slug만 반환한다", async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: { slug: "random-room", title: "무시할 제목" } },
    });

    await expect(fetchRandomEntryRoom()).resolves.toEqual({
      slug: "random-room",
    });
    expect(axiosInstance.get).toHaveBeenCalledWith("/api/v1/rooms/random");
  });
});
