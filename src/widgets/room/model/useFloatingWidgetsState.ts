"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import type { DraggableData } from "react-draggable";

export type WidgetId = "profile" | "queue" | "chat";

type WidgetOffset = {
  x: number;
  y: number;
};

type ViewportSize = {
  height: number;
  width: number;
};

type WidgetBounds = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

type WidgetConfig = {
  height: number;
  left?: number;
  offsetStorageKey: string;
  openStorageKey: string;
  top?: number;
  width: number;
} & (
  | {
      bottom: number;
      centeredX?: boolean;
    }
  | {
      bottom?: never;
      centeredX?: boolean;
    }
);

export type FloatingWidgetViewState = {
  bounds: WidgetBounds;
  height: number;
  isOpen: boolean;
  offset: WidgetOffset;
  placementStyle: CSSProperties;
  width: number;
  zIndex: number;
};

export type FloatingWidgetsView = Record<WidgetId, FloatingWidgetViewState>;

const MAX_WIDGET_OUT_OF_VIEW_RATIO = 0.6;

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
  queue: {
    bottom: 140,
    height: 407,
    left: 24,
    offsetStorageKey: "queueWidgetOffset",
    openStorageKey: "isQueueOpen",
    width: 300,
  },
};

function getStoredBoolean(key: string) {
  if (typeof window === "undefined") {
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
  const widget = WIDGET_CONFIG[widgetId];
  const x = widget.centeredX
    ? (viewportSize.width - widget.width) / 2
    : (widget.left ?? 0);
  const y =
    typeof widget.top === "number"
      ? widget.top
      : viewportSize.height - widget.height - (widget.bottom ?? 0);

  return { x, y };
}

function getWidgetBounds(
  widgetId: WidgetId,
  viewportSize: ViewportSize,
): WidgetBounds {
  const widget = WIDGET_CONFIG[widgetId];
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

function clampWidgetOffset(
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
  key: string,
  widgetId: WidgetId,
): WidgetOffset {
  if (typeof window === "undefined") {
    return { x: 0, y: 0 };
  }

  const savedValue = window.localStorage.getItem(key);
  if (!savedValue) {
    return { x: 0, y: 0 };
  }

  try {
    const parsedValue = JSON.parse(savedValue) as Partial<WidgetOffset>;
    if (
      typeof parsedValue.x !== "number" ||
      typeof parsedValue.y !== "number"
    ) {
      window.localStorage.removeItem(key);
      return { x: 0, y: 0 };
    }

    const clampedOffset = clampWidgetOffset(widgetId, {
      x: parsedValue.x,
      y: parsedValue.y,
    });

    if (
      clampedOffset.x !== parsedValue.x ||
      clampedOffset.y !== parsedValue.y
    ) {
      window.localStorage.setItem(key, JSON.stringify(clampedOffset));
    }

    return clampedOffset;
  } catch {
    window.localStorage.removeItem(key);
    return { x: 0, y: 0 };
  }
}

function getWidgetPlacementStyle(widgetId: WidgetId): CSSProperties {
  const widget = WIDGET_CONFIG[widgetId];

  if (typeof widget.top === "number") {
    return {
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
  const [viewportSize, setViewportSize] = useState<ViewportSize>(() =>
    getViewportSize(),
  );
  const [isProfileOpen, setIsProfileOpen] = useState(() =>
    getStoredBoolean(WIDGET_CONFIG.profile.openStorageKey),
  );
  const [isQueueOpen, setIsQueueOpen] = useState(() =>
    getStoredBoolean(WIDGET_CONFIG.queue.openStorageKey),
  );
  const [isChatOpen, setIsChatOpen] = useState(() =>
    getStoredBoolean(WIDGET_CONFIG.chat.openStorageKey),
  );
  const [profileWidgetOffset, setProfileWidgetOffset] = useState<WidgetOffset>(
    () =>
      getStoredWidgetOffset(WIDGET_CONFIG.profile.offsetStorageKey, "profile"),
  );
  const [queueWidgetOffset, setQueueWidgetOffset] = useState<WidgetOffset>(() =>
    getStoredWidgetOffset(WIDGET_CONFIG.queue.offsetStorageKey, "queue"),
  );
  const [chatWidgetOffset, setChatWidgetOffset] = useState<WidgetOffset>(() =>
    getStoredWidgetOffset(WIDGET_CONFIG.chat.offsetStorageKey, "chat"),
  );
  const [activeWidget, setActiveWidget] = useState<WidgetId | null>(null);

  useEffect(() => {
    function handleResize() {
      setViewportSize(getViewportSize());
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
    }
  }

  function setWidgetOffset(widgetId: WidgetId, nextOffset: WidgetOffset) {
    switch (widgetId) {
      case "profile":
        setProfileWidgetOffset(nextOffset);
        return;
      case "queue":
        setQueueWidgetOffset(nextOffset);
        return;
      case "chat":
        setChatWidgetOffset(nextOffset);
        return;
    }
  }

  function toggleWidget(widgetId: WidgetId) {
    const nextValue = !getWidgetOpen(widgetId);
    setWidgetOpen(widgetId, nextValue);

    if (nextValue) {
      setActiveWidget(widgetId);
    }

    window.localStorage.setItem(
      WIDGET_CONFIG[widgetId].openStorageKey,
      String(nextValue),
    );
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
    window.localStorage.setItem(
      WIDGET_CONFIG[widgetId].offsetStorageKey,
      JSON.stringify(nextOffset),
    );
  }

  const widgets: FloatingWidgetsView = {
    chat: {
      bounds: getWidgetBounds("chat", viewportSize),
      height: WIDGET_CONFIG.chat.height,
      isOpen: isChatOpen,
      offset: chatWidgetOffset,
      placementStyle: getWidgetPlacementStyle("chat"),
      width: WIDGET_CONFIG.chat.width,
      zIndex: activeWidget === "chat" ? 3 : 1,
    },
    profile: {
      bounds: getWidgetBounds("profile", viewportSize),
      height: WIDGET_CONFIG.profile.height,
      isOpen: isProfileOpen,
      offset: profileWidgetOffset,
      placementStyle: getWidgetPlacementStyle("profile"),
      width: WIDGET_CONFIG.profile.width,
      zIndex: activeWidget === "profile" ? 3 : 1,
    },
    queue: {
      bounds: getWidgetBounds("queue", viewportSize),
      height: WIDGET_CONFIG.queue.height,
      isOpen: isQueueOpen,
      offset: queueWidgetOffset,
      placementStyle: getWidgetPlacementStyle("queue"),
      width: WIDGET_CONFIG.queue.width,
      zIndex: activeWidget === "queue" ? 3 : 1,
    },
  };

  return {
    activateWidget,
    handleWidgetStop,
    toggleWidget,
    widgets,
  };
}
