import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTransientManagementError } from "./useTransientManagementError";

describe("useTransientManagementError", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("현재 요청의 오류만 표시하고 지정 시간이 지나면 제거한다", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTransientManagementError());

    let sequence = 0;
    act(() => {
      sequence = result.current.begin();
      result.current.show(sequence, "방장 위임 실패");
    });
    expect(result.current.message).toBe("방장 위임 실패");

    act(() => vi.advanceTimersByTime(1_999));
    expect(result.current.message).toBe("방장 위임 실패");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.message).toBeNull();
  });

  it("재시도와 대상 전환 후 도착한 이전 요청 오류를 무시한다", () => {
    const { result } = renderHook(() => useTransientManagementError());

    let previousSequence = 0;
    let currentSequence = 0;
    act(() => {
      previousSequence = result.current.begin();
      currentSequence = result.current.begin();
      result.current.show(previousSequence, "이전 요청 실패");
      result.current.show(currentSequence, "현재 요청 실패");
    });
    expect(result.current.message).toBe("현재 요청 실패");

    act(() => result.current.clear());
    act(() => result.current.show(currentSequence, "대상 전환 전 실패"));
    expect(result.current.message).toBeNull();
  });

  it("unmount에서 실행 중인 제거 타이머를 정리한다", () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    const { result, unmount } = renderHook(() =>
      useTransientManagementError(),
    );

    act(() => {
      const sequence = result.current.begin();
      result.current.show(sequence, "방장 위임 실패");
    });
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalledOnce();
    clearTimeoutSpy.mockRestore();
  });
});
