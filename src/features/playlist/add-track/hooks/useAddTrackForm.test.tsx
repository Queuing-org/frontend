import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ADD_TRACK_STORY_MAX_LENGTH,
  useAddTrackForm,
} from "./useAddTrackForm";

describe("useAddTrackForm", () => {
  it("재생목록 URL은 추가 범위를 선택하기 전까지 제출 요청을 만들지 않는다", () => {
    const { result } = renderHook(() => useAddTrackForm());
    const playlistUrl =
      "https://www.youtube.com/watch?v=current&list=PL_playlist-1";

    act(() => result.current.updateInputValue(playlistUrl));

    expect(result.current.canSubmit).toBe(false);
    expect(result.current.queueSource).toEqual({
      currentVideoId: "current",
      kind: "playlist",
      playlistUrl,
    });
    expect(result.current.queueMode).toBeNull();
    expect(result.current.queueRequest).toBeNull();
  });

  it("시청 재생목록은 현재 영상 또는 전체 재생목록을 명시적으로 선택한다", () => {
    const { result } = renderHook(() => useAddTrackForm());
    const playlistUrl =
      "https://www.youtube.com/watch?v=current&list=PL_playlist-1";

    act(() => result.current.updateInputValue(playlistUrl));
    act(() => result.current.updateQueueMode("single"));

    expect(result.current.queueRequest).toEqual({
      videoId: "current",
      youtubePlaylist: false,
    });

    act(() => result.current.updateQueueMode("playlist"));

    expect(result.current.queueRequest).toEqual({
      videoId: playlistUrl,
      youtubePlaylist: true,
    });
  });

  it("순수 재생목록 URL은 현재 영상 선택을 거부하고 전체 추가만 허용한다", () => {
    const { result } = renderHook(() => useAddTrackForm());
    const playlistUrl =
      "https://www.youtube.com/playlist?list=PL_playlist-1";

    act(() => result.current.updateInputValue(playlistUrl));
    act(() => result.current.updateQueueMode("single"));
    expect(result.current.queueMode).toBeNull();
    expect(result.current.queueRequest).toBeNull();

    act(() => result.current.updateQueueMode("playlist"));
    expect(result.current.queueRequest).toEqual({
      videoId: playlistUrl,
      youtubePlaylist: true,
    });
  });

  it("URL을 바꾸면 이전 재생목록 범위 선택을 초기화한다", () => {
    const { result } = renderHook(() => useAddTrackForm());

    act(() =>
      result.current.updateInputValue(
        "https://www.youtube.com/watch?v=first&list=PL_playlist-1",
      ),
    );
    act(() => result.current.updateQueueMode("playlist"));
    act(() =>
      result.current.updateInputValue(
        "https://www.youtube.com/watch?v=second&list=PL_playlist-2",
      ),
    );

    expect(result.current.queueMode).toBeNull();
    expect(result.current.queueRequest).toBeNull();
  });

  it("30자를 넘긴 사연을 유지해 제출 검증이 오류를 표시할 수 있게 한다", () => {
    const { result } = renderHook(() => useAddTrackForm());

    act(() => result.current.updateStoryValue("가".repeat(31)));

    expect(ADD_TRACK_STORY_MAX_LENGTH).toBe(30);
    expect(result.current.storyValue).toBe("가".repeat(31));
    expect(result.current.storyLength).toBe(31);
    expect(result.current.storyMaxLength).toBe(30);
  });

  it("수정한 필드의 오류만 해제한다", () => {
    const { result } = renderHook(() => useAddTrackForm());

    act(() => result.current.setError("url", "URL 오류"));
    act(() => result.current.updateStoryValue("사연 수정"));
    expect(result.current.errorField).toBe("url");

    act(() => result.current.updateInputValue("https://youtu.be/video"));
    expect(result.current.errorField).toBeNull();

    act(() => result.current.setError("story", "사연 오류"));
    act(() => result.current.updateInputValue("https://youtu.be/other"));
    expect(result.current.errorField).toBe("story");

    act(() => result.current.updateStoryValue("수정"));
    expect(result.current.errorField).toBeNull();
  });
});
