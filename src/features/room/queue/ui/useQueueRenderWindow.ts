"use client";

import { useEffect, useState, type RefObject } from "react";

export const QUEUE_MAX_MOUNTED_ITEMS_PER_LIST = 40;
const QUEUE_RENDER_OVERSCAN = 6;
const DEFAULT_QUEUE_ROW_HEIGHT = 74;
const DEFAULT_VISIBLE_QUEUE_ROWS = 12;

type QueueRenderWindow = {
  endIndex: number;
  itemCount: number;
  paddingBottom: number;
  paddingTop: number;
  rowHeight: number;
  startIndex: number;
};

export function getQueueRenderWindow({
  itemCount,
  listTop,
  rowHeight,
  scrollTop,
  viewportHeight,
}: {
  itemCount: number;
  listTop: number;
  rowHeight: number;
  scrollTop: number;
  viewportHeight: number;
}): QueueRenderWindow {
  const safeRowHeight = rowHeight > 0 ? rowHeight : DEFAULT_QUEUE_ROW_HEIGHT;
  const visibleRows =
    viewportHeight > 0
      ? Math.ceil(viewportHeight / safeRowHeight)
      : DEFAULT_VISIBLE_QUEUE_ROWS;
  const firstVisibleIndex = Math.max(
    0,
    Math.floor((scrollTop - listTop) / safeRowHeight),
  );
  const startIndex = Math.max(0, firstVisibleIndex - QUEUE_RENDER_OVERSCAN);
  const requestedItemCount = Math.min(
    QUEUE_MAX_MOUNTED_ITEMS_PER_LIST,
    visibleRows + QUEUE_RENDER_OVERSCAN * 2,
  );
  const endIndex = Math.min(itemCount, startIndex + requestedItemCount);
  const clampedStartIndex = Math.max(0, endIndex - requestedItemCount);

  return {
    endIndex,
    itemCount,
    paddingBottom: Math.max(0, itemCount - endIndex) * safeRowHeight,
    paddingTop: clampedStartIndex * safeRowHeight,
    rowHeight: safeRowHeight,
    startIndex: clampedStartIndex,
  };
}

export function resizeQueueRenderWindow(
  currentWindow: QueueRenderWindow,
  itemCount: number,
): QueueRenderWindow {
  const defaultWindowSize = Math.min(
    QUEUE_MAX_MOUNTED_ITEMS_PER_LIST,
    DEFAULT_VISIBLE_QUEUE_ROWS + QUEUE_RENDER_OVERSCAN * 2,
  );
  const requestedItemCount = Math.max(
    defaultWindowSize,
    currentWindow.endIndex - currentWindow.startIndex,
  );
  const startIndex = Math.min(
    currentWindow.startIndex,
    Math.max(0, itemCount - requestedItemCount),
  );
  const endIndex = Math.min(itemCount, startIndex + requestedItemCount);

  return {
    endIndex,
    itemCount,
    paddingBottom: Math.max(0, itemCount - endIndex) * currentWindow.rowHeight,
    paddingTop: startIndex * currentWindow.rowHeight,
    rowHeight: currentWindow.rowHeight,
    startIndex,
  };
}

export function useQueueRenderWindow(
  itemCount: number,
  listRef: RefObject<HTMLUListElement | null>,
  frozen = false,
) {
  const [renderWindow, setRenderWindow] = useState<QueueRenderWindow>(() =>
    getQueueRenderWindow({
      itemCount,
      listTop: 0,
      rowHeight: DEFAULT_QUEUE_ROW_HEIGHT,
      scrollTop: 0,
      viewportHeight: 0,
    }),
  );

  useEffect(() => {
    const list = listRef.current;
    const scrollContainer = list?.closest<HTMLElement>(
      "[data-queue-scroll-container]",
    );
    if (!list || !scrollContainer) {
      const fallbackFrameId = window.requestAnimationFrame(() => {
        setRenderWindow(
          getQueueRenderWindow({
            itemCount,
            listTop: 0,
            rowHeight: DEFAULT_QUEUE_ROW_HEIGHT,
            scrollTop: 0,
            viewportHeight: 0,
          }),
        );
      });
      return () => window.cancelAnimationFrame(fallbackFrameId);
    }

    let frameId: number | null = null;
    const updateRenderWindow = () => {
      if (frozen) {
        return;
      }

      const measuredItem = list.querySelector<HTMLElement>(
        '[data-queue-virtual-item="true"]',
      );
      const measuredRowHeight =
        measuredItem?.getBoundingClientRect().height ||
        DEFAULT_QUEUE_ROW_HEIGHT;
      const listRect = list.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      const listTop =
        listRect.top - containerRect.top + scrollContainer.scrollTop;
      const nextWindow = getQueueRenderWindow({
        itemCount,
        listTop,
        rowHeight: measuredRowHeight,
        scrollTop: scrollContainer.scrollTop,
        viewportHeight: scrollContainer.clientHeight,
      });

      setRenderWindow((currentWindow) =>
        currentWindow.startIndex === nextWindow.startIndex &&
        currentWindow.endIndex === nextWindow.endIndex &&
        currentWindow.itemCount === nextWindow.itemCount &&
        currentWindow.paddingTop === nextWindow.paddingTop &&
        currentWindow.paddingBottom === nextWindow.paddingBottom &&
        currentWindow.rowHeight === nextWindow.rowHeight
          ? currentWindow
          : nextWindow,
      );
    };
    const scheduleUpdate = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        updateRenderWindow();
      });
    };

    updateRenderWindow();
    scrollContainer.addEventListener("scroll", scheduleUpdate, {
      passive: true,
    });
    window.addEventListener("resize", scheduleUpdate);
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleUpdate);
    resizeObserver?.observe(scrollContainer);

    return () => {
      scrollContainer.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver?.disconnect();
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [frozen, itemCount, listRef]);

  // itemCount changes must be reflected in the same commit. Waiting for the
  // passive measuring effect leaves the list at its previous total height for
  // one commit, so a parent layout effect can align or restore scroll against
  // stale geometry and then be displaced by the virtual spacer.
  return renderWindow.itemCount === itemCount
    ? renderWindow
    : resizeQueueRenderWindow(renderWindow, itemCount);
}
