import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { searchUsers } from "./searchUsers";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { get: vi.fn() },
}));

describe("searchUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: { hasNext: false, items: [] } },
    });
  });

  it("React Query의 AbortSignal을 사용자 검색 요청에 전달한다", async () => {
    const abortController = new AbortController();

    await searchUsers(
      { limit: 10, query: "감튀" },
      abortController.signal,
    );

    expect(axiosInstance.get).toHaveBeenCalledWith("/api/v1/user-profiles", {
      params: { limit: 10, query: "감튀" },
      signal: abortController.signal,
    });
  });
});
