"use client";

import type { CSSProperties } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { DraggableData } from "react-draggable";
import {
  getDesktopViewportDensity,
  type DesktopViewportDensity,
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
  density: DesktopViewportDensity;
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
const CHAT_PARTICIPANTS_GAP = 24;
const CHAT_OFFSET_STORAGE_KEY = "chatWidgetOffset:v2";
const LEGACY_CHAT_BOTTOM = 140;
const LEGACY_CHAT_OFFSET_STORAGE_KEY = "chatWidgetOffset";
const PARTICIPANTS_COMPACT_MAX_WIDTH = 1600;
const WIDGET_IDS: readonly WidgetId[] = [
  "profile",
  "queue",
  "chat",
  "participants",
];

const WIDGET_CONFIG: Record<WidgetId, WidgetConfig> = {
  chat: {
    height: 205,
    offsetStorageKey: CHAT_OFFSET_STORAGE_KEY,
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

function getWidgetViewportDensity(
  widgetId: WidgetId,
  viewportSize: ViewportSize,
): DesktopViewportDensity {
  const density = getDesktopViewportDensity(viewportSize);

  if (
    widgetId === "participants" &&
    density === "compact" &&
    viewportSize.width > PARTICIPANTS_COMPACT_MAX_WIDTH
  ) {
    return "normal";
  }

  return density;
}

export function getWidgetConfig(
  widgetId: WidgetId,
  viewportSize: ViewportSize,
): WidgetConfig {
  const widget = WIDGET_CONFIG[widgetId];

  if (getWidgetViewportDensity(widgetId, viewportSize) === "normal") {
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
  return getWidgetViewportDensity(widgetId, viewportSize) === "compact"
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

function getAnchoredWidgetBasePosition(
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

function getLegacyChatBasePosition(viewportSize: ViewportSize): WidgetOffset {
  const chat = getWidgetConfig("chat", viewportSize);
  const scale =
    getWidgetViewportDensity("chat", viewportSize) === "compact"
      ? LAPTOP_COMPACT_SCALE
      : 1;

  return {
    x: (viewportSize.width - chat.width) / 2,
    y:
      viewportSize.height -
      chat.height -
      LEGACY_CHAT_BOTTOM * scale,
  };
}

function getWidgetBasePosition(
  widgetId: WidgetId,
  viewportSize: ViewportSize,
): WidgetOffset {
  if (widgetId !== "chat") {
    return getAnchoredWidgetBasePosition(widgetId, viewportSize);
  }

  const chat = getWidgetConfig("chat", viewportSize);
  const participantsPosition = getAnchoredWidgetBasePosition(
    "participants",
    viewportSize,
  );
  const participants = getWidgetConfig("participants", viewportSize);
  const queuePosition = getAnchoredWidgetBasePosition("queue", viewportSize);
  const queue = getWidgetConfig("queue", viewportSize);
  const chatDensity = getWidgetViewportDensity("chat", viewportSize);
  const participantsGap =
    CHAT_PARTICIPANTS_GAP *
    (chatDensity === "compact" ? LAPTOP_COMPACT_SCALE : 1);
  const maxHiddenWidth = chat.width * MAX_WIDGET_OUT_OF_VIEW_RATIO;
  const maxHiddenHeight = chat.height * MAX_WIDGET_OUT_OF_VIEW_RATIO;

  return {
    x: clamp(
      participantsPosition.x + participants.width - chat.width,
      -maxHiddenWidth,
      viewportSize.width - (chat.width - maxHiddenWidth),
    ),
    y: clamp(
      Math.max(
        queuePosition.y + queue.height / 2,
        participantsPosition.y + participants.height + participantsGap,
      ),
      -maxHiddenHeight,
      viewportSize.height - (chat.height - maxHiddenHeight),
    ),
  };
}

export function getDefaultWidgetOffset(
  widgetId: WidgetId,
  viewportSize: ViewportSize,
): WidgetOffset {
  return clampWidgetOffset(widgetId, { x: 0, y: 0 }, viewportSize);
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
    if (widgetId === "chat") {
      const legacyStorageKey =
        getWidgetViewportDensity("chat", viewportSize) === "compact"
          ? `${LEGACY_CHAT_OFFSET_STORAGE_KEY}:compact`
          : LEGACY_CHAT_OFFSET_STORAGE_KEY;
      const legacySavedValue = window.localStorage.getItem(legacyStorageKey);
      if (legacySavedValue) {
        try {
          const legacyOffset = JSON.parse(
            legacySavedValue,
          ) as Partial<WidgetOffset>;
          if (
            typeof legacyOffset.x === "number" &&
            Number.isFinite(legacyOffset.x) &&
            typeof legacyOffset.y === "number" &&
            Number.isFinite(legacyOffset.y)
          ) {
            const legacyBasePosition =
              getLegacyChatBasePosition(viewportSize);
            const currentBasePosition = getWidgetBasePosition(
              "chat",
              viewportSize,
            );
            const migratedOffset = clampWidgetOffset(
              "chat",
              {
                x:
                  legacyBasePosition.x +
                  legacyOffset.x -
                  currentBasePosition.x,
                y:
                  legacyBasePosition.y +
                  legacyOffset.y -
                  currentBasePosition.y,
              },
              viewportSize,
            );

            window.localStorage.setItem(
              storageKey,
              JSON.stringify(migratedOffset),
            );
            window.localStorage.removeItem(legacyStorageKey);
            return migratedOffset;
          }
        } catch {
          // 손상된 legacy 좌표는 새 기본 위치로 복구한다.
        }

        window.localStorage.removeItem(legacyStorageKey);
      }
    }

    return getDefaultWidgetOffset(widgetId, viewportSize);
  }

  try {
    const parsedValue = JSON.parse(savedValue) as Partial<WidgetOffset>;
    if (
      typeof parsedValue.x !== "number" ||
      !Number.isFinite(parsedValue.x) ||
      typeof parsedValue.y !== "number" ||
      !Number.isFinite(parsedValue.y)
    ) {
      window.localStorage.removeItem(storageKey);
      return getDefaultWidgetOffset(widgetId, viewportSize);
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
    return getDefaultWidgetOffset(widgetId, viewportSize);
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

function getDefaultWidgetOffsets(viewportSize: ViewportSize): WidgetOffsets {
  return {
    chat: getDefaultWidgetOffset("chat", viewportSize),
    participants: getDefaultWidgetOffset("participants", viewportSize),
    profile: getDefaultWidgetOffset("profile", viewportSize),
    queue: getDefaultWidgetOffset("queue", viewportSize),
  };
}

function getResizedWidgetOffset(
  widgetId: WidgetId,
  currentOffset: WidgetOffset,
  currentViewportSize: ViewportSize,
  nextViewportSize: ViewportSize,
) {
  if (
    getWidgetViewportDensity(widgetId, currentViewportSize) !==
    getWidgetViewportDensity(widgetId, nextViewportSize)
  ) {
    return getStoredWidgetOffset(widgetId, nextViewportSize);
  }

  const currentDefaultOffset = getDefaultWidgetOffset(
    widgetId,
    currentViewportSize,
  );
  if (
    currentOffset.x === currentDefaultOffset.x &&
    currentOffset.y === currentDefaultOffset.y
  ) {
    return getDefaultWidgetOffset(widgetId, nextViewportSize);
  }

  return clampWidgetOffset(widgetId, currentOffset, nextViewportSize);
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

export function getWidgetPlacementStyle(
  widgetId: WidgetId,
  viewportSize: ViewportSize,
): CSSProperties {
  const widget = getWidgetConfig(widgetId, viewportSize);

  if (widgetId === "chat") {
    const basePosition = getWidgetBasePosition(widgetId, viewportSize);
    return {
      right: Math.round(
        (viewportSize.width - basePosition.x - widget.width) * 10,
      ) / 10,
      top: basePosition.y,
    };
  }

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

  useEffect(() => {
    function handleResize() {
      const nextViewportSize = getViewportSize();
      setLayout((current) => {
        const nextOffsets = {
          chat: getResizedWidgetOffset(
            "chat",
            current.offsets.chat,
            current.viewportSize,
            nextViewportSize,
          ),
          participants: getResizedWidgetOffset(
            "participants",
            current.offsets.participants,
            current.viewportSize,
            nextViewportSize,
          ),
          profile: getResizedWidgetOffset(
            "profile",
            current.offsets.profile,
            current.viewportSize,
            nextViewportSize,
          ),
          queue: getResizedWidgetOffset(
            "queue",
            current.offsets.queue,
            current.viewportSize,
            nextViewportSize,
          ),
        };

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
      offsets: getDefaultWidgetOffsets(current.viewportSize),
    }));
    setResetVersion((current) => current + 1);

    if (!isMobileWidgetViewport()) {
      WIDGET_IDS.forEach((widgetId) => {
        window.localStorage.removeItem(
          getWidgetOffsetStorageKey(widgetId, viewportSize),
        );
        if (widgetId === "chat") {
          window.localStorage.removeItem(
            getWidgetViewportDensity("chat", viewportSize) === "compact"
              ? `${LEGACY_CHAT_OFFSET_STORAGE_KEY}:compact`
              : LEGACY_CHAT_OFFSET_STORAGE_KEY,
          );
        }
      });
    }
  }

  const widgets: FloatingWidgetsView = {
    chat: {
      bounds: getWidgetBounds("chat", viewportSize),
      density: getWidgetViewportDensity("chat", viewportSize),
      height: getWidgetConfig("chat", viewportSize).height,
      isOpen: isHydrated && isChatOpen,
      layoutKey: `${getWidgetViewportDensity("chat", viewportSize)}:${resetVersion}:${offsets.chat.x}:${offsets.chat.y}`,
      offset: offsets.chat,
      placementStyle: getWidgetPlacementStyle("chat", viewportSize),
      width: getWidgetConfig("chat", viewportSize).width,
      zIndex: activeWidget === "chat" ? 3 : 1,
    },
    profile: {
      bounds: getWidgetBounds("profile", viewportSize),
      density: getWidgetViewportDensity("profile", viewportSize),
      height: getWidgetConfig("profile", viewportSize).height,
      isOpen: isHydrated && isProfileOpen,
      layoutKey: `${getWidgetViewportDensity("profile", viewportSize)}:${resetVersion}:${offsets.profile.x}:${offsets.profile.y}`,
      offset: offsets.profile,
      placementStyle: getWidgetPlacementStyle("profile", viewportSize),
      width: getWidgetConfig("profile", viewportSize).width,
      zIndex: activeWidget === "profile" ? 3 : 1,
    },
    participants: {
      bounds: getWidgetBounds("participants", viewportSize),
      density: getWidgetViewportDensity("participants", viewportSize),
      height: getWidgetConfig("participants", viewportSize).height,
      isOpen: isHydrated && isParticipantsOpen,
      layoutKey: `${getWidgetViewportDensity("participants", viewportSize)}:${resetVersion}:${offsets.participants.x}:${offsets.participants.y}`,
      offset: offsets.participants,
      placementStyle: getWidgetPlacementStyle("participants", viewportSize),
      width: getWidgetConfig("participants", viewportSize).width,
      zIndex: activeWidget === "participants" ? 3 : 1,
    },
    queue: {
      bounds: getWidgetBounds("queue", viewportSize),
      density: getWidgetViewportDensity("queue", viewportSize),
      height: getWidgetConfig("queue", viewportSize).height,
      isOpen: isHydrated && isQueueOpen,
      layoutKey: `${getWidgetViewportDensity("queue", viewportSize)}:${resetVersion}:${offsets.queue.x}:${offsets.queue.y}`,
      offset: offsets.queue,
      placementStyle: getWidgetPlacementStyle("queue", viewportSize),
      width: getWidgetConfig("queue", viewportSize).width,
      zIndex: activeWidget === "queue" ? 3 : 1,
    },
  };

  return {
    activateWidget,
    handleWidgetStop,
    isViewportReady: isHydrated,
    resetWidgetPositions,
    toggleWidget,
    viewportSize,
    widgets,
  };
}
