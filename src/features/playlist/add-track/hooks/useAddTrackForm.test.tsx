import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ADD_TRACK_STORY_MAX_LENGTH,
  useAddTrackForm,
} from "./useAddTrackForm";

describe("useAddTrackForm", () => {
  it("재생목록 URL을 제출 가능한 queue source로 만든다", () => {
    const { result } = renderHook(() => useAddTrackForm());
    const playlistUrl =
      "https://www.youtube.com/watch?v=current&list=PL_playlist-1";

    act(() => result.current.updateInputValue(playlistUrl));

    expect(result.current.canSubmit).toBe(true);
    expect(result.current.queueSource).toEqual({
      videoId: playlistUrl,
      youtubePlaylist: true,
    });
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
