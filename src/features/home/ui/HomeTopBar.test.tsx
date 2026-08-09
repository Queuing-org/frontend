import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomeTopBar from "./HomeTopBar";

vi.mock("next/image", () => ({
  default: ({ alt = "" }: { alt?: string }) => <span aria-label={alt} />,
}));

describe("HomeTopBar mobile search", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("raw 입력은 로컬에 유지하고 debounce된 검색어만 상위로 전달한다", () => {
    vi.useFakeTimers();
    const onMobileSearchQueryChange = vi.fn();
    render(
      <HomeTopBar
        currentRoom={null}
        isChromeReduced
        onMobileSearchQueryChange={onMobileSearchQueryChange}
      />,
    );
    onMobileSearchQueryChange.mockClear();

    fireEvent.change(screen.getByLabelText("방 검색", { selector: "input" }), {
      target: { value: "재" },
    });
    fireEvent.change(screen.getByLabelText("방 검색", { selector: "input" }), {
      target: { value: "재즈" },
    });

    expect(onMobileSearchQueryChange).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(299));
    expect(onMobileSearchQueryChange).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onMobileSearchQueryChange).toHaveBeenCalledOnce();
    expect(onMobileSearchQueryChange).toHaveBeenCalledWith("재즈");
  });
});
