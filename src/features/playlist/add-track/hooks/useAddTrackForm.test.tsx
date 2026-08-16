import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ADD_TRACK_STORY_MAX_LENGTH,
  useAddTrackForm,
} from "./useAddTrackForm";

describe("useAddTrackForm", () => {
  it("곡 신청 사연과 카운터를 최대 30자로 제한한다", () => {
    const { result } = renderHook(() => useAddTrackForm());

    act(() => result.current.updateStoryValue("가".repeat(31)));

    expect(ADD_TRACK_STORY_MAX_LENGTH).toBe(30);
    expect(result.current.storyValue).toBe("가".repeat(30));
    expect(result.current.storyLength).toBe(30);
    expect(result.current.storyMaxLength).toBe(30);
  });
});
