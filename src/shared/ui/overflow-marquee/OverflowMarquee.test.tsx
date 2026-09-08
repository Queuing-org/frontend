import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import OverflowMarquee, { getMarqueeMetrics } from "./OverflowMarquee";

class ResizeObserverMock {
  static callback: ResizeObserverCallback | null = null;
  static instanceCount = 0;
  static latest: ResizeObserverMock | null = null;

  constructor(callback: ResizeObserverCallback) {
    ResizeObserverMock.callback = callback;
    ResizeObserverMock.instanceCount += 1;
    ResizeObserverMock.latest = this;
  }

  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
}

describe("OverflowMarquee", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    ResizeObserverMock.callback = null;
    ResizeObserverMock.instanceCount = 0;
    ResizeObserverMock.latest = null;
  });

  it("overflow 여부와 읽기 속도에 맞는 이동 값을 계산한다", () => {
    expect(getMarqueeMetrics(200, 180).overflowing).toBe(false);
    expect(getMarqueeMetrics(200, 360)).toEqual({
      distance: 392,
      duration: 392 / 36,
      overflowing: true,
    });
  });

  it("실제 너비가 넘을 때만 복제 문장과 순환 상태를 만든다", () => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(120);
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(320);

    const { container } = render(
      <>
        <OverflowMarquee text="아주 긴 신청 사연" />
        <OverflowMarquee text="또 다른 긴 신청 사연" />
      </>,
    );
    act(() => ResizeObserverMock.callback?.([], {} as ResizeObserver));

    expect(screen.getAllByText("아주 긴 신청 사연")).toHaveLength(2);
    expect(screen.getAllByText("또 다른 긴 신청 사연")).toHaveLength(2);
    expect(ResizeObserverMock.instanceCount).toBe(1);
    expect(ResizeObserverMock.latest?.observe).toHaveBeenCalledTimes(2);
    expect(
      container.querySelector('[data-overflowing="true"]'),
    ).toHaveAttribute("title", "아주 긴 신청 사연");
  });
});
