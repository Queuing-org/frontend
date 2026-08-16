import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clampWidgetOffset,
  getDefaultWidgetOffset,
  getWidgetBounds,
  getWidgetConfig,
  getWidgetOffsetStorageKey,
  getWidgetPlacementStyle,
  type WidgetId,
  useFloatingWidgetsState,
} from "./useFloatingWidgetsState";

const normalViewport = { height: 1080, width: 1920 };
const compactViewport = { height: 864, width: 1536 };
const wideCompactViewport = { height: 800, width: 1920 };
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
      matches: query === "(max-width: 480px)" && window.innerWidth <= 480,
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
  it.each([
    [normalViewport, { right: 24, top: 672.5 }],
    [compactViewport, { right: 19.2, top: 538 }],
    [wideCompactViewport, { right: 24, top: 499.2 }],
  ])(
    "%o viewport에서 채팅 DOM을 참가자 아래·신청곡 패널 중앙 높이에 배치한다",
    (viewport, expectedPlacement) => {
      expect(getWidgetPlacementStyle("chat", viewport)).toEqual(
        expectedPlacement,
      );
      expect(getDefaultWidgetOffset("chat", viewport)).toEqual({ x: 0, y: 0 });
    },
  );

  it("새 기준으로 저장된 채팅 drag offset은 기본 위치보다 우선한다", () => {
    window.localStorage.setItem(
      getWidgetOffsetStorageKey("chat", normalViewport),
      JSON.stringify({ x: 32, y: 48 }),
    );

    const { result } = renderHook(() => useFloatingWidgetsState());

    expect(result.current.widgets.chat.offset).toEqual({ x: 32, y: 48 });
  });

  it("기존 중앙 anchor 기준 채팅 offset을 화면상 위치가 유지되도록 변환한다", () => {
    window.localStorage.setItem(
      "chatWidgetOffset",
      JSON.stringify({ x: 32, y: 48 }),
    );

    const { result } = renderHook(() => useFloatingWidgetsState());
    const migratedOffset = result.current.widgets.chat.offset;
    const placement = getWidgetPlacementStyle("chat", normalViewport);

    expect(migratedOffset).toEqual({ x: -754, y: 111 });
    expect(
      normalViewport.width -
        (placement.right as number) -
        getWidgetConfig("chat", normalViewport).width +
        migratedOffset.x,
    ).toBe(842);
    expect((placement.top as number) + migratedOffset.y).toBeCloseTo(783.5);
    expect(window.localStorage.getItem("chatWidgetOffset")).toBeNull();
    expect(
      window.localStorage.getItem(
        getWidgetOffsetStorageKey("chat", normalViewport),
      ),
    ).toBe(JSON.stringify(migratedOffset));
  });

  it("같은 density에서 viewport가 바뀌면 저장값 없는 채팅 기본 위치를 다시 계산한다", () => {
    const resizedNormalViewport = { height: 1000, width: 1680 };
    const { result } = renderHook(() => useFloatingWidgetsState());

    expect(result.current.widgets.chat.offset).toEqual(
      getDefaultWidgetOffset("chat", normalViewport),
    );

    act(() => {
      setViewport(resizedNormalViewport.width, resizedNormalViewport.height);
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current.widgets.chat.offset).toEqual(
      getDefaultWidgetOffset("chat", resizedNormalViewport),
    );
  });

  it("density 전환 시 각 viewport의 채팅 기본 위치를 복원한다", () => {
    const { result } = renderHook(() => useFloatingWidgetsState());

    act(() => {
      setViewport(compactViewport.width, compactViewport.height);
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current.widgets.chat.offset).toEqual(
      getDefaultWidgetOffset("chat", compactViewport),
    );

    act(() => {
      setViewport(normalViewport.width, normalViewport.height);
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current.widgets.chat.offset).toEqual(
      getDefaultWidgetOffset("chat", normalViewport),
    );
  });

  it.each([
    ["1536×864", compactViewport],
    ["1920×800", wideCompactViewport],
  ])("%s viewport에서 위젯 geometry를 정확히 80%%로 줄인다", (_, viewport) => {
    const profile = getWidgetConfig("profile", viewport);
    expect(profile).toMatchObject({
      height: 344.8,
      top: 48,
      width: 240,
    });
    expect(profile.left).toBeCloseTo(19.2);
    const queue = getWidgetConfig("queue", viewport);
    expect(queue).toMatchObject({
      bottom: 112,
      height: 428,
      width: 240,
    });
    expect(queue.left).toBeCloseTo(19.2);
  });

  it("FHD viewport에서는 확장된 프로필 위젯 geometry를 사용한다", () => {
    expect(getWidgetConfig("profile", normalViewport)).toMatchObject({
      height: 431,
      left: 24,
      top: 60,
      width: 300,
    });
  });

  it("normal과 compact offset 저장소를 분리한다", () => {
    expect(getWidgetOffsetStorageKey("chat", normalViewport)).toBe(
      "chatWidgetOffset:v2",
    );
    expect(getWidgetOffsetStorageKey("chat", compactViewport)).toBe(
      "chatWidgetOffset:v2:compact",
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
      height: 431,
      offset: { x: 11, y: 12 },
      width: 300,
    });

    act(() => {
      setViewport(compactViewport.width, compactViewport.height);
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current.widgets.profile).toMatchObject({
      height: 344.8,
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

  it("열린 모든 위젯을 닫고 open 저장 상태를 false로 동기화한다", () => {
    widgetIds.forEach((widgetId) => {
      const storageKey =
        widgetId === "chat"
          ? "isChatOpen"
          : widgetId === "participants"
            ? "isParticipantsOpen"
            : widgetId === "profile"
              ? "isProfileOpen"
              : "isQueueOpen";
      window.localStorage.setItem(storageKey, "true");
    });
    const { result } = renderHook(() => useFloatingWidgetsState());

    expect(Object.values(result.current.widgets).every((widget) => widget.isOpen)).toBe(
      true,
    );

    act(() => {
      result.current.closeAllWidgets();
    });

    expect(Object.values(result.current.widgets).every((widget) => !widget.isOpen)).toBe(
      true,
    );
    expect(window.localStorage.getItem("isChatOpen")).toBe("false");
    expect(window.localStorage.getItem("isParticipantsOpen")).toBe("false");
    expect(window.localStorage.getItem("isProfileOpen")).toBe("false");
    expect(window.localStorage.getItem("isQueueOpen")).toBe("false");
  });

  it("서버 렌더에서는 저장된 open 상태를 노출하지 않는다", () => {
    window.localStorage.setItem("isProfileOpen", "true");

    expect(renderToString(createElement(FloatingWidgetHydrationProbe))).toContain(
      "closed",
    );
  });
});
