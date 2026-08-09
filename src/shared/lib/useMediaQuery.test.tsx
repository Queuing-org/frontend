import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "./useMediaQuery";

function MediaQueryProbe() {
  return createElement(
    "span",
    null,
    useMediaQuery("(max-width: 760px)") ? "mobile" : "desktop",
  );
}

describe("useMediaQuery", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("서버 snapshot은 viewport와 무관하게 결정적인 desktop 값을 사용한다", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true }) as MediaQueryList),
    );

    expect(renderToString(createElement(MediaQueryProbe))).toContain("desktop");
  });

  it("client snapshot과 change event를 구독한다", () => {
    const listeners = new Set<() => void>();
    const mediaQueryList = {
      matches: true,
      addEventListener: vi.fn(
        (_eventName: string, listener: () => void) => listeners.add(listener),
      ),
      removeEventListener: vi.fn(
        (_eventName: string, listener: () => void) => listeners.delete(listener),
      ),
    } as unknown as MediaQueryList;
    vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));

    const { result, unmount } = renderHook(() =>
      useMediaQuery("(max-width: 760px)"),
    );
    expect(result.current).toBe(true);

    Object.defineProperty(mediaQueryList, "matches", { value: false });
    act(() => listeners.forEach((listener) => listener()));
    expect(result.current).toBe(false);

    unmount();
    expect(listeners.size).toBe(0);
  });
});
