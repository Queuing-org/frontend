import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clampWidgetOffset,
  getWidgetBounds,
  getWidgetConfig,
  getWidgetOffsetStorageKey,
  type WidgetId,
  useFloatingWidgetsState,
} from "./useFloatingWidgetsState";

const normalViewport = { height: 1080, width: 1920 };
const compactViewport = { height: 864, width: 1536 };
const widgetIds: readonly WidgetId[] = [
  "chat",
  "participants",
  "profile",
  "queue",
];

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: height,
  });
}

beforeEach(() => {
  window.localStorage.clear();
  setViewport(normalViewport.width, normalViewport.height);
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: query === "(max-width: 760px)" && window.innerWidth <= 760,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  );
});

function FloatingWidgetHydrationProbe() {
  const { widgets } = useFloatingWidgetsState();
  return createElement("span", null, widgets.profile.isOpen ? "open" : "closed");
}

describe("floating widget laptop compact layout", () => {
  it("노트북 viewport에서 위젯 geometry를 정확히 80%로 줄인다", () => {
    const profile = getWidgetConfig("profile", compactViewport);
    expect(profile).toMatchObject({
      height: 304,
      top: 64,
      width: 240,
    });
    expect(profile.left).toBeCloseTo(19.2);
    const queue = getWidgetConfig("queue", compactViewport);
    expect(queue).toMatchObject({
      bottom: 112,
      height: 428,
      width: 240,
    });
    expect(queue.left).toBeCloseTo(19.2);
  });

  it("FHD viewport에서는 기존 위젯 geometry를 유지한다", () => {
    expect(getWidgetConfig("profile", normalViewport)).toMatchObject({
      height: 380,
      left: 24,
      top: 80,
      width: 300,
    });
  });

  it("normal과 compact offset 저장소를 분리한다", () => {
    expect(getWidgetOffsetStorageKey("chat", normalViewport)).toBe(
      "chatWidgetOffset",
    );
    expect(getWidgetOffsetStorageKey("chat", compactViewport)).toBe(
      "chatWidgetOffset:compact",
    );
  });

  it("compact geometry 기준으로 drag offset을 viewport 안에 clamp한다", () => {
    const bounds = getWidgetBounds("participants", compactViewport);
    const clamped = clampWidgetOffset(
      "participants",
      { x: Number.POSITIVE_INFINITY, y: Number.NEGATIVE_INFINITY },
      compactViewport,
    );

    expect(clamped).toEqual({ x: bounds.right, y: bounds.top });
  });

  it("viewport mode 전환 시 normal과 compact offset을 각각 복원한다", () => {
    window.localStorage.setItem(
      "profileWidgetOffset",
      JSON.stringify({ x: 11, y: 12 }),
    );
    window.localStorage.setItem(
      "profileWidgetOffset:compact",
      JSON.stringify({ x: 21, y: 22 }),
    );
    const { result } = renderHook(() => useFloatingWidgetsState());

    expect(result.current.widgets.profile).toMatchObject({
      height: 380,
      offset: { x: 11, y: 12 },
      width: 300,
    });

    act(() => {
      setViewport(compactViewport.width, compactViewport.height);
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current.widgets.profile).toMatchObject({
      height: 304,
      offset: { x: 21, y: 22 },
      width: 240,
    });
    expect(result.current.widgets.profile.layoutKey).toContain("compact:");

    act(() => {
      setViewport(normalViewport.width, normalViewport.height);
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current.widgets.profile.offset).toEqual({ x: 11, y: 12 });
  });

  it("현재 viewport의 모든 위젯 위치를 기본값으로 되돌리고 저장값을 제거한다", () => {
    const storedOffset = JSON.stringify({ x: 18, y: 24 });
    widgetIds.forEach((widgetId) => {
      window.localStorage.setItem(
        getWidgetOffsetStorageKey(widgetId, normalViewport),
        storedOffset,
      );
    });
    window.localStorage.setItem("isParticipantsOpen", "true");

    const { result } = renderHook(() => useFloatingWidgetsState());
    const previousLayoutKey = result.current.widgets.participants.layoutKey;

    act(() => {
      result.current.resetWidgetPositions();
    });

    expect(result.current.widgets.participants.isOpen).toBe(true);
    expect(result.current.widgets.participants.layoutKey).not.toBe(
      previousLayoutKey,
    );
    expect(
      Object.values(result.current.widgets).map((widget) => widget.offset),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ]);
    widgetIds.forEach((widgetId) => {
      expect(
        window.localStorage.getItem(
          getWidgetOffsetStorageKey(widgetId, normalViewport),
        ),
      ).toBeNull();
    });
  });

  it("compact 위치 초기화가 normal 저장 위치를 지우지 않는다", () => {
    setViewport(compactViewport.width, compactViewport.height);
    window.localStorage.setItem(
      "profileWidgetOffset",
      JSON.stringify({ x: 11, y: 12 }),
    );
    window.localStorage.setItem(
      "profileWidgetOffset:compact",
      JSON.stringify({ x: 21, y: 22 }),
    );
    const { result } = renderHook(() => useFloatingWidgetsState());

    act(() => {
      result.current.resetWidgetPositions();
    });

    expect(result.current.widgets.profile.offset).toEqual({ x: 0, y: 0 });
    expect(window.localStorage.getItem("profileWidgetOffset:compact")).toBeNull();
    expect(window.localStorage.getItem("profileWidgetOffset")).toBe(
      JSON.stringify({ x: 11, y: 12 }),
    );
  });

  it("서버 렌더에서는 저장된 open 상태를 노출하지 않는다", () => {
    window.localStorage.setItem("isProfileOpen", "true");

    expect(renderToString(createElement(FloatingWidgetHydrationProbe))).toContain(
      "closed",
    );
  });
});
