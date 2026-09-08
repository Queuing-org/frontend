import { describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  fetchFrequentTracks,
  searchYouTubeVideos,
} from "./fetchTrackSuggestions";
vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { get: vi.fn() },
}));
describe("track suggestion API", () => {
  it("응답을 해제하고 서버 순서를 최대 8개 유지하며 cursor 없이 취소 신호를 전달한다", async () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      videoId: String(i),
    }));
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: { items, hasNext: false, nextCursor: null } },
    });
    const signal = new AbortController().signal;
    expect(await fetchFrequentTracks(signal)).toEqual(items.slice(0, 8));
    expect(axiosInstance.get).toHaveBeenLastCalledWith(
      "/api/v1/user-profiles/me/frequent-tracks",
      { signal },
    );
    expect(await searchYouTubeVideos("좋은 날", signal)).toEqual(
      items.slice(0, 8),
    );
    expect(axiosInstance.get).toHaveBeenLastCalledWith(
      "/api/v1/youtube/videos",
      { params: { query: "좋은 날", size: 8 }, signal },
    );
  });
});
