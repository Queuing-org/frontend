import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useIdlePreload } from "./useIdlePreload";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useIdlePreload", () => {
  it("브라우저 idle 시 모든 리소스를 선로딩하고 예약을 정리한다", () => {
    let idleCallback: IdleRequestCallback | null = null;
    const requestIdleCallback = vi.fn(
      (callback: IdleRequestCallback, options?: IdleRequestOptions) => {
        idleCallback = callback;
        expect(options).toEqual({ timeout: 1_500 });
        return 42;
      },
    );
    const cancelIdleCallback = vi.fn();
    vi.stubGlobal("requestIdleCallback", requestIdleCallback);
    vi.stubGlobal("cancelIdleCallback", cancelIdleCallback);
    const firstPreload = vi.fn().mockResolvedValue(undefined);
    const secondPreload = vi.fn().mockResolvedValue(undefined);

    const { unmount } = renderHook(() =>
      useIdlePreload([firstPreload, secondPreload]),
    );

    expect(firstPreload).not.toHaveBeenCalled();
    act(() => {
      idleCallback?.({
        didTimeout: false,
        timeRemaining: () => 10,
      });
    });
    expect(firstPreload).toHaveBeenCalledOnce();
    expect(secondPreload).toHaveBeenCalledOnce();

    unmount();
    expect(cancelIdleCallback).toHaveBeenCalledWith(42);
  });

  it("idle API가 없으면 1500ms 후 선로딩하고 unmount 시 타이머를 정리한다", () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestIdleCallback", undefined);
    vi.stubGlobal("cancelIdleCallback", undefined);
    const preload = vi.fn().mockRejectedValue(new Error("chunk failed"));

    const firstRender = renderHook(() => useIdlePreload([preload]));
    act(() => {
      vi.advanceTimersByTime(1_499);
    });
    expect(preload).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(preload).toHaveBeenCalledOnce();
    firstRender.unmount();

    const canceledPreload = vi.fn().mockResolvedValue(undefined);
    const secondRender = renderHook(() =>
      useIdlePreload([canceledPreload]),
    );
    secondRender.unmount();
    act(() => {
      vi.advanceTimersByTime(1_500);
    });
    expect(canceledPreload).not.toHaveBeenCalled();
  });
});
