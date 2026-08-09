"use client";

import type { CSSProperties } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { DraggableData } from "react-draggable";
import {
  getDesktopViewportDensity,
  type ViewportSize,
} from "@/src/shared/lib/viewportDensity";

export type WidgetId = "profile" | "queue" | "chat" | "participants";

type WidgetOffset = {
  x: number;
  y: number;
};

type WidgetOffsets = Record<WidgetId, WidgetOffset>;

type FloatingWidgetLayoutState = {
  offsets: WidgetOffsets;
  viewportSize: ViewportSize;
};

type WidgetBounds = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

type WidgetConfig = {
  bottom?: number;
  centeredX?: boolean;
  height: number;
  left?: number;
  offsetStorageKey: string;
  openStorageKey: string;
  right?: number;
  top?: number;
  width: number;
};

export type FloatingWidgetViewState = {
  bounds: WidgetBounds;
  height: number;
  isOpen: boolean;
  layoutKey: string;
  offset: WidgetOffset;
  placementStyle: CSSProperties;
  width: number;
  zIndex: number;
};

export type FloatingWidgetsView = Record<WidgetId, FloatingWidgetViewState>;

const MAX_WIDGET_OUT_OF_VIEW_RATIO = 0.6;
const MOBILE_WIDGET_QUERY = "(max-width: 760px)";
const LAPTOP_COMPACT_SCALE = 0.8;
const WIDGET_IDS: readonly WidgetId[] = [
  "profile",
  "queue",
  "chat",
  "participants",
];

const WIDGET_CONFIG: Record<WidgetId, WidgetConfig> = {
  chat: {
    bottom: 140,
    centeredX: true,
    height: 205,
    offsetStorageKey: "chatWidgetOffset",
    openStorageKey: "isChatOpen",
    width: 300,
  },
  profile: {
    height: 380,
    left: 24,
    offsetStorageKey: "profileWidgetOffset",
    openStorageKey: "isProfileOpen",
    top: 80,
    width: 300,
  },
  participants: {
    height: 400,
    offsetStorageKey: "participantsWidgetOffset",
    openStorageKey: "isParticipantsOpen",
    right: 24,
    top: 80,
    width: 300,
  },
  queue: {
    bottom: 140,
    height: 535,
    left: 24,
    offsetStorageKey: "queueWidgetOffset",
    openStorageKey: "isQueueOpen",
    width: 300,
  },
};

export function getWidgetConfig(
  widgetId: WidgetId,
  viewportSize: ViewportSize,
): WidgetConfig {
  const widget = WIDGET_CONFIG[widgetId];

  if (getDesktopViewportDensity(viewportSize) === "normal") {
    return widget;
  }

  return {
    ...widget,
    ...(typeof widget.bottom === "number"
      ? { bottom: widget.bottom * LAPTOP_COMPACT_SCALE }
      : {}),
    ...(typeof widget.left === "number"
      ? { left: widget.left * LAPTOP_COMPACT_SCALE }
      : {}),
    ...(typeof widget.right === "number"
      ? { right: widget.right * LAPTOP_COMPACT_SCALE }
      : {}),
    ...(typeof widget.top === "number"
      ? { top: widget.top * LAPTOP_COMPACT_SCALE }
      : {}),
    height: widget.height * LAPTOP_COMPACT_SCALE,
    width: widget.width * LAPTOP_COMPACT_SCALE,
  };
}

export function getWidgetOffsetStorageKey(
  widgetId: WidgetId,
  viewportSize: ViewportSize,
) {
  const baseKey = WIDGET_CONFIG[widgetId].offsetStorageKey;
  return getDesktopViewportDensity(viewportSize) === "compact"
    ? `${baseKey}:compact`
    : baseKey;
}

function isMobileWidgetViewport() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(MOBILE_WIDGET_QUERY).matches;
}

function getStoredBoolean(key: string) {
  if (typeof window === "undefined") {
    return false;
  }

  if (isMobileWidgetViewport()) {
    return false;
  }

  return window.localStorage.getItem(key) === "true";
}

function getViewportSize(): ViewportSize {
  if (typeof window === "undefined") {
    return { height: 0, width: 0 };
  }

  return {
    height: window.innerHeight,
    width: window.innerWidth,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getWidgetBasePosition(
  widgetId: WidgetId,
  viewportSize: ViewportSize,
): WidgetOffset {
  const widget = getWidgetConfig(widgetId, viewportSize);
  const x = widget.centeredX
    ? (viewportSize.width - widget.width) / 2
    : typeof widget.right === "number"
      ? viewportSize.width - widget.width - widget.right
      : (widget.left ?? 0);
  const y =
    typeof widget.top === "number"
      ? widget.top
      : viewportSize.height - widget.height - (widget.bottom ?? 0);

  return { x, y };
}

export function getWidgetBounds(
  widgetId: WidgetId,
  viewportSize: ViewportSize,
): WidgetBounds {
  const widget = getWidgetConfig(widgetId, viewportSize);
  const basePosition = getWidgetBasePosition(widgetId, viewportSize);
  const maxHiddenWidth = widget.width * MAX_WIDGET_OUT_OF_VIEW_RATIO;
  const maxHiddenHeight = widget.height * MAX_WIDGET_OUT_OF_VIEW_RATIO;
  const minVisibleWidth = widget.width - maxHiddenWidth;
  const minVisibleHeight = widget.height - maxHiddenHeight;
  const minLeft = -maxHiddenWidth;
  const maxLeft = viewportSize.width - minVisibleWidth;
  const minTop = -maxHiddenHeight;
  const maxTop = viewportSize.height - minVisibleHeight;

  return {
    bottom: Math.round(maxTop - basePosition.y),
    left: Math.round(minLeft - basePosition.x),
    right: Math.round(maxLeft - basePosition.x),
    top: Math.round(minTop - basePosition.y),
  };
}

export function clampWidgetOffset(
  widgetId: WidgetId,
  nextOffset: WidgetOffset,
  viewportSize = getViewportSize(),
): WidgetOffset {
  const bounds = getWidgetBounds(widgetId, viewportSize);

  return {
    x: Math.round(clamp(nextOffset.x, bounds.left, bounds.right)),
    y: Math.round(clamp(nextOffset.y, bounds.top, bounds.bottom)),
  };
}

function getStoredWidgetOffset(
  widgetId: WidgetId,
  viewportSize = getViewportSize(),
): WidgetOffset {
  if (typeof window === "undefined") {
    return { x: 0, y: 0 };
  }

  if (isMobileWidgetViewport()) {
    return { x: 0, y: 0 };
  }

  const storageKey = getWidgetOffsetStorageKey(widgetId, viewportSize);
  const savedValue = window.localStorage.getItem(storageKey);
  if (!savedValue) {
    return { x: 0, y: 0 };
  }

  try {
    const parsedValue = JSON.parse(savedValue) as Partial<WidgetOffset>;
    if (
      typeof parsedValue.x !== "number" ||
      typeof parsedValue.y !== "number"
    ) {
      window.localStorage.removeItem(storageKey);
      return { x: 0, y: 0 };
    }

    const clampedOffset = clampWidgetOffset(
      widgetId,
      { x: parsedValue.x, y: parsedValue.y },
      viewportSize,
    );

    if (
      clampedOffset.x !== parsedValue.x ||
      clampedOffset.y !== parsedValue.y
    ) {
      window.localStorage.setItem(storageKey, JSON.stringify(clampedOffset));
    }

    return clampedOffset;
  } catch {
    window.localStorage.removeItem(storageKey);
    return { x: 0, y: 0 };
  }
}

function getStoredWidgetOffsets(viewportSize: ViewportSize): WidgetOffsets {
  return {
    chat: getStoredWidgetOffset("chat", viewportSize),
    participants: getStoredWidgetOffset("participants", viewportSize),
    profile: getStoredWidgetOffset("profile", viewportSize),
    queue: getStoredWidgetOffset("queue", viewportSize),
  };
}

function getDefaultWidgetOffsets(): WidgetOffsets {
  return {
    chat: { x: 0, y: 0 },
    participants: { x: 0, y: 0 },
    profile: { x: 0, y: 0 },
    queue: { x: 0, y: 0 },
  };
}

function clampWidgetOffsets(
  offsets: WidgetOffsets,
  viewportSize: ViewportSize,
): WidgetOffsets {
  return {
    chat: clampWidgetOffset("chat", offsets.chat, viewportSize),
    participants: clampWidgetOffset(
      "participants",
      offsets.participants,
      viewportSize,
    ),
    profile: clampWidgetOffset("profile", offsets.profile, viewportSize),
    queue: clampWidgetOffset("queue", offsets.queue, viewportSize),
  };
}

function getInitialWidgetLayoutState(): FloatingWidgetLayoutState {
  const viewportSize = getViewportSize();
  return {
    offsets: getStoredWidgetOffsets(viewportSize),
    viewportSize,
  };
}

function subscribeToHydration() {
  return () => undefined;
}

function getWidgetPlacementStyle(
  widgetId: WidgetId,
  viewportSize: ViewportSize,
): CSSProperties {
  const widget = getWidgetConfig(widgetId, viewportSize);

  if (typeof widget.top === "number") {
    return typeof widget.right === "number"
      ? {
          right: widget.right,
          top: widget.top,
        }
      : {
          left: widget.left ?? 0,
          top: widget.top,
        };
  }

  if (widget.centeredX) {
    return {
      bottom: widget.bottom,
      left: "50%",
      transform: "translateX(-50%)",
    };
  }

  return {
    bottom: widget.bottom,
    left: widget.left ?? 0,
  };
}

export function useFloatingWidgetsState() {
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const [layout, setLayout] = useState(getInitialWidgetLayoutState);
  const { offsets, viewportSize } = layout;
  const [isProfileOpen, setIsProfileOpen] = useState(() =>
    getStoredBoolean(WIDGET_CONFIG.profile.openStorageKey),
  );
  const [isQueueOpen, setIsQueueOpen] = useState(() =>
    getStoredBoolean(WIDGET_CONFIG.queue.openStorageKey),
  );
  const [isChatOpen, setIsChatOpen] = useState(() =>
    getStoredBoolean(WIDGET_CONFIG.chat.openStorageKey),
  );
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(() =>
    getStoredBoolean(WIDGET_CONFIG.participants.openStorageKey),
  );
  const [activeWidget, setActiveWidget] = useState<WidgetId | null>(null);
  const [resetVersion, setResetVersion] = useState(0);
  const layoutMode = getDesktopViewportDensity(viewportSize);

  useEffect(() => {
    function handleResize() {
      const nextViewportSize = getViewportSize();
      setLayout((current) => {
        const currentMode = getDesktopViewportDensity(current.viewportSize);
        const nextMode = getDesktopViewportDensity(nextViewportSize);
        const nextOffsets =
          currentMode === nextMode
            ? clampWidgetOffsets(current.offsets, nextViewportSize)
            : getStoredWidgetOffsets(nextViewportSize);

        return { offsets: nextOffsets, viewportSize: nextViewportSize };
      });
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function getWidgetOpen(widgetId: WidgetId) {
    switch (widgetId) {
      case "profile":
        return isProfileOpen;
      case "queue":
        return isQueueOpen;
      case "chat":
        return isChatOpen;
      case "participants":
        return isParticipantsOpen;
    }
  }

  function setWidgetOpen(widgetId: WidgetId, nextValue: boolean) {
    switch (widgetId) {
      case "profile":
        setIsProfileOpen(nextValue);
        return;
      case "queue":
        setIsQueueOpen(nextValue);
        return;
      case "chat":
        setIsChatOpen(nextValue);
        return;
      case "participants":
        setIsParticipantsOpen(nextValue);
        return;
    }
  }

  function setWidgetOffset(widgetId: WidgetId, nextOffset: WidgetOffset) {
    setLayout((current) => ({
      ...current,
      offsets: { ...current.offsets, [widgetId]: nextOffset },
    }));
  }

  function toggleWidget(widgetId: WidgetId) {
    const nextValue = !getWidgetOpen(widgetId);
    setWidgetOpen(widgetId, nextValue);

    if (nextValue) {
      setActiveWidget(widgetId);
    }

    if (!isMobileWidgetViewport()) {
      window.localStorage.setItem(
        WIDGET_CONFIG[widgetId].openStorageKey,
        String(nextValue),
      );
    }
  }

  function activateWidget(widgetId: WidgetId) {
    setActiveWidget(widgetId);
  }

  function handleWidgetStop(widgetId: WidgetId, data: DraggableData) {
    const nextOffset = clampWidgetOffset(
      widgetId,
      { x: data.x, y: data.y },
      viewportSize,
    );

    setWidgetOffset(widgetId, nextOffset);
    if (!isMobileWidgetViewport()) {
      window.localStorage.setItem(
        getWidgetOffsetStorageKey(widgetId, viewportSize),
        JSON.stringify(nextOffset),
      );
    }
  }

  function resetWidgetPositions() {
    setLayout((current) => ({
      ...current,
      offsets: getDefaultWidgetOffsets(),
    }));
    setResetVersion((current) => current + 1);

    if (!isMobileWidgetViewport()) {
      WIDGET_IDS.forEach((widgetId) => {
        window.localStorage.removeItem(
          getWidgetOffsetStorageKey(widgetId, viewportSize),
        );
      });
    }
  }

  const widgets: FloatingWidgetsView = {
    chat: {
      bounds: getWidgetBounds("chat", viewportSize),
      height: getWidgetConfig("chat", viewportSize).height,
      isOpen: isHydrated && isChatOpen,
      layoutKey: `${layoutMode}:${resetVersion}:${offsets.chat.x}:${offsets.chat.y}`,
      offset: offsets.chat,
      placementStyle: getWidgetPlacementStyle("chat", viewportSize),
      width: getWidgetConfig("chat", viewportSize).width,
      zIndex: activeWidget === "chat" ? 3 : 1,
    },
    profile: {
      bounds: getWidgetBounds("profile", viewportSize),
      height: getWidgetConfig("profile", viewportSize).height,
      isOpen: isHydrated && isProfileOpen,
      layoutKey: `${layoutMode}:${resetVersion}:${offsets.profile.x}:${offsets.profile.y}`,
      offset: offsets.profile,
      placementStyle: getWidgetPlacementStyle("profile", viewportSize),
      width: getWidgetConfig("profile", viewportSize).width,
      zIndex: activeWidget === "profile" ? 3 : 1,
    },
    participants: {
      bounds: getWidgetBounds("participants", viewportSize),
      height: getWidgetConfig("participants", viewportSize).height,
      isOpen: isHydrated && isParticipantsOpen,
      layoutKey: `${layoutMode}:${resetVersion}:${offsets.participants.x}:${offsets.participants.y}`,
      offset: offsets.participants,
      placementStyle: getWidgetPlacementStyle("participants", viewportSize),
      width: getWidgetConfig("participants", viewportSize).width,
      zIndex: activeWidget === "participants" ? 3 : 1,
    },
    queue: {
      bounds: getWidgetBounds("queue", viewportSize),
      height: getWidgetConfig("queue", viewportSize).height,
      isOpen: isHydrated && isQueueOpen,
      layoutKey: `${layoutMode}:${resetVersion}:${offsets.queue.x}:${offsets.queue.y}`,
      offset: offsets.queue,
      placementStyle: getWidgetPlacementStyle("queue", viewportSize),
      width: getWidgetConfig("queue", viewportSize).width,
      zIndex: activeWidget === "queue" ? 3 : 1,
    },
  };

  return {
    activateWidget,
    handleWidgetStop,
    resetWidgetPositions,
    toggleWidget,
    widgets,
  };
}
