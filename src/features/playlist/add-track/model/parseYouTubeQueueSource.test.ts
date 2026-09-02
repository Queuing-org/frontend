import { describe, expect, it } from "vitest";
import {
  createYouTubeQueueRequest,
  parseYouTubeQueueSource,
} from "./parseYouTubeQueueSource";

describe("parseYouTubeQueueSource", () => {
  it.each([
    ["https://www.youtube.com/watch?v=video-id", "video-id"],
    ["https://youtu.be/short-video", "short-video"],
    ["m.youtube.com/watch?v=mobile-video", "mobile-video"],
  ])("단일 영상 URL은 영상 ID로 변환한다", (input, videoId) => {
    expect(parseYouTubeQueueSource(input)).toEqual({
      kind: "video",
      videoId,
    });
  });

  it.each([
    "https://www.youtube.com/watch?v=current-video&list=PL_playlist-1&index=4",
    "https://www.youtube.com/playlist?list=PL_playlist-1",
    "https://youtu.be/current-video?list=PL_playlist-1",
  ])("list가 있는 URL은 선택 가능한 재생목록으로 해석한다", (input) => {
    const source = parseYouTubeQueueSource(input);

    expect(source).toMatchObject({
      kind: "playlist",
      playlistUrl: input,
    });
  });

  it("시청 URL의 현재 영상 ID를 재생목록과 함께 유지한다", () => {
    expect(
      parseYouTubeQueueSource(
        "https://www.youtube.com/watch?v=current-video&list=PL_playlist-1",
      ),
    ).toEqual({
      currentVideoId: "current-video",
      kind: "playlist",
      playlistUrl:
        "https://www.youtube.com/watch?v=current-video&list=PL_playlist-1",
    });
  });

  it("순수 재생목록 URL은 현재 영상이 없다고 표시한다", () => {
    expect(
      parseYouTubeQueueSource(
        "https://www.youtube.com/playlist?list=PL_playlist-1",
      ),
    ).toEqual({
      currentVideoId: null,
      kind: "playlist",
      playlistUrl: "https://www.youtube.com/playlist?list=PL_playlist-1",
    });
  });

  it("스킴이 없는 재생목록 URL은 backend가 해석할 수 있는 URL로 정규화한다", () => {
    expect(
      parseYouTubeQueueSource("youtube.com/playlist?list=PL_playlist-1"),
    ).toEqual({
      currentVideoId: null,
      kind: "playlist",
      playlistUrl: "https://youtube.com/playlist?list=PL_playlist-1",
    });
  });

  it("시청 재생목록은 선택에 따라 현재 영상 또는 전체 URL 요청을 만든다", () => {
    const source = parseYouTubeQueueSource(
      "https://www.youtube.com/watch?v=current-video&list=PL_playlist-1",
    );

    expect(createYouTubeQueueRequest(source, null)).toBeNull();
    expect(createYouTubeQueueRequest(source, "single")).toEqual({
      videoId: "current-video",
      youtubePlaylist: false,
    });
    expect(createYouTubeQueueRequest(source, "playlist")).toEqual({
      videoId:
        "https://www.youtube.com/watch?v=current-video&list=PL_playlist-1",
      youtubePlaylist: true,
    });
  });

  it("현재 영상이 없는 재생목록은 단일 영상 요청을 만들지 않는다", () => {
    const source = parseYouTubeQueueSource(
      "https://www.youtube.com/playlist?list=PL_playlist-1",
    );

    expect(createYouTubeQueueRequest(source, "single")).toBeNull();
    expect(createYouTubeQueueRequest(source, "playlist")).toEqual({
      videoId: "https://www.youtube.com/playlist?list=PL_playlist-1",
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
