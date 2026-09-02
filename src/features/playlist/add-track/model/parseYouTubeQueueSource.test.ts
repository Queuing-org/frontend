import { describe, expect, it } from "vitest";
import { parseYouTubeQueueSource } from "./parseYouTubeQueueSource";

describe("parseYouTubeQueueSource", () => {
  it.each([
    ["https://www.youtube.com/watch?v=video-id", "video-id"],
    ["https://youtu.be/short-video", "short-video"],
    ["m.youtube.com/watch?v=mobile-video", "mobile-video"],
  ])("단일 영상 URL은 영상 ID로 변환한다", (input, videoId) => {
    expect(parseYouTubeQueueSource(input)).toEqual({
      videoId,
      youtubePlaylist: false,
    });
  });

  it.each([
    "https://www.youtube.com/watch?v=current-video&list=PL_playlist-1&index=4",
    "https://www.youtube.com/playlist?list=PL_playlist-1",
    "https://youtu.be/current-video?list=PL_playlist-1",
  ])("list가 있는 URL은 현재 영상보다 재생목록을 우선한다", (input) => {
    expect(parseYouTubeQueueSource(input)).toEqual({
      videoId: input,
      youtubePlaylist: true,
    });
  });

  it("스킴이 없는 재생목록 URL은 backend가 해석할 수 있는 URL로 정규화한다", () => {
    expect(
      parseYouTubeQueueSource("youtube.com/playlist?list=PL_playlist-1"),
    ).toEqual({
      videoId: "https://youtube.com/playlist?list=PL_playlist-1",
      youtubePlaylist: true,
    });
  });

  it.each([
    "https://example.com/watch?v=video-id",
    "https://www.youtube.com/playlist",
    "https://www.youtube.com/watch?v=current-video&list=",
    "https://www.youtube.com/shorts/current-video?list=PL_playlist-1",
    "https://www.youtube.com/watch&list=PL_playlist-1",
  ])("지원하지 않거나 잘못된 URL은 거부한다", (input) => {
    expect(parseYouTubeQueueSource(input)).toBeNull();
  });
});
