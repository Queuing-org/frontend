"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  type UIEvent,
} from "react";
import type { QueueTab } from "../model/roomQueue";

export const QUEUE_SCROLL_EDGE_THRESHOLD = 96;

type HistoryAnchorSnapshot = {
  historyId: number;
  historyIndex: number;
  rowHeight: number;
  rowOffset: number;
  scrollHeight: number;
  scrollTop: number;
};

type UseQueueBidirectionalScrollParams = {
  activeTab: QueueTab;
  currentEntryId: string | null;
  hasHistoryError: boolean;
  hasNextHistoryPage: boolean;
  hasNextQueuePage: boolean;
  hasQueueError: boolean;
  historyEntryIds: number[];
  isFetchingHistory: boolean;
  isFetchingQueue: boolean;
  isInteractionBusy: boolean;
  onLoadNextHistoryPage: () => unknown;
  onLoadNextQueuePage: () => unknown;
  onResetHistoryToLatestPage: () => unknown;
  onRetryHistoryPage: () => unknown;
  queueEntryIds: string[];
};

function getElementOffsetFromContainer(
  element: HTMLElement,
  container: HTMLElement,
) {
  return (
    element.getBoundingClientRect().top -
    container.getBoundingClientRect().top
  );
}

function findFirstVisibleHistoryRow(container: HTMLElement) {
  const containerTop = container.getBoundingClientRect().top;

  return Array.from(
    container.querySelectorAll<HTMLElement>("[data-queue-history-id]"),
  ).find((row) => row.getBoundingClientRect().bottom > containerTop);
}

export function getQueueDistanceFromBottom(container: HTMLElement) {
  const contentEnd = container.querySelector<HTMLElement>(
    "[data-queue-content-end]",
  );
  if (contentEnd) {
    return Math.max(
      0,
      contentEnd.getBoundingClientRect().bottom -
        container.getBoundingClientRect().bottom,
    );
  }

  return Math.max(
    0,
    container.scrollHeight - container.clientHeight - container.scrollTop,
  );
}

export function getQueueTailHeight({
  anchorTop,
  containerHeight,
  contentEndTop,
}: {
  anchorTop: number;
  containerHeight: number;
  contentEndTop: number;
}) {
  return Math.max(
    0,
    Math.ceil(containerHeight - Math.max(0, contentEndTop - anchorTop)),
  );
}

export function useQueueBidirectionalScroll({
  activeTab,
  currentEntryId,
  hasHistoryError,
  hasNextHistoryPage,
  hasNextQueuePage,
  hasQueueError,
  historyEntryIds,
  isFetchingHistory,
  isFetchingQueue,
  isInteractionBusy,
  onLoadNextHistoryPage,
  onLoadNextQueuePage,
  onResetHistoryToLatestPage,
  onRetryHistoryPage,
  queueEntryIds,
}: UseQueueBidirectionalScrollParams) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const topRequestLatchedRef = useRef(false);
  const bottomRequestLatchedRef = useRef(false);
  const pendingHistoryAnchorRef = useRef<HistoryAnchorSnapshot | null>(null);
  const previousHistoryLengthRef = useRef(0);
  const keepCurrentAlignedRef = useRef(false);
  const isCurrentAlignedRef = useRef(false);
  const getCurrentAnchor = useCallback(() => {
    if (activeTab !== "all") {
      return null;
    }

    const container = scrollContainerRef.current;
    return container?.querySelector<HTMLElement>(
      currentEntryId
        ? "[data-queue-current-anchor]"
        : "[data-queue-current-boundary]",
    ) ?? null;
  }, [activeTab, currentEntryId]);

  const updateTailSpacer = useCallback(() => {
    const container = scrollContainerRef.current;
    const tailSpacer = container?.querySelector<HTMLElement>(
      "[data-queue-tail-spacer]",
    );
    if (!container || !tailSpacer) {
      return;
    }

    const anchor = getCurrentAnchor();
    const contentEnd = container.querySelector<HTMLElement>(
      "[data-queue-content-end]",
    );
    if (!anchor || !contentEnd) {
      return;
    }

    tailSpacer.style.height = `${getQueueTailHeight({
      anchorTop: anchor.getBoundingClientRect().top,
      containerHeight: container.clientHeight,
      contentEndTop: contentEnd.getBoundingClientRect().top,
    })}px`;
  }, [getCurrentAnchor]);

  const alignCurrentToTop = useCallback(() => {
    const container = scrollContainerRef.current;
    const anchor = getCurrentAnchor();
    if (!container || !anchor) {
      return;
    }

    updateTailSpacer();
    container.scrollTop += getElementOffsetFromContainer(anchor, container);
    isCurrentAlignedRef.current = true;
  }, [getCurrentAnchor, updateTailSpacer]);

  const updateTailAndRestoreCurrent = useCallback(() => {
    const shouldRestoreCurrent = isCurrentAlignedRef.current;
    updateTailSpacer();
    if (shouldRestoreCurrent) {
      alignCurrentToTop();
    }
  }, [alignCurrentToTop, updateTailSpacer]);

  const captureHistoryAnchor = useCallback(() => {
    const container = scrollContainerRef.current;
    const row = container ? findFirstVisibleHistoryRow(container) : null;
    if (!container || !row) {
      return;
    }

    const historyId = Number(row.dataset.queueHistoryId);
    const historyIndex = historyEntryIds.indexOf(historyId);
    if (!Number.isFinite(historyId) || historyIndex < 0) {
      return;
    }

    const rowRect = row.getBoundingClientRect();
    pendingHistoryAnchorRef.current = {
      historyId,
      historyIndex,
      rowHeight: rowRect.height,
      rowOffset: getElementOffsetFromContainer(row, container),
      scrollHeight: container.scrollHeight,
      scrollTop: container.scrollTop,
    };
  }, [historyEntryIds]);

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const container = event.currentTarget;
      const currentAnchor = getCurrentAnchor();
      isCurrentAlignedRef.current = Boolean(
        currentAnchor &&
          Math.abs(
            getElementOffsetFromContainer(currentAnchor, container),
          ) <= 1,
      );
      const isNearTop = container.scrollTop <= QUEUE_SCROLL_EDGE_THRESHOLD;
      const isNearBottom =
        getQueueDistanceFromBottom(container) <=
        QUEUE_SCROLL_EDGE_THRESHOLD;

      if (!isNearTop) {
        topRequestLatchedRef.current = false;
      }
      if (!isNearBottom) {
        bottomRequestLatchedRef.current = false;
      }

      if (
        activeTab === "all" &&
        isNearTop &&
        hasNextHistoryPage &&
        !hasHistoryError &&
        !isFetchingHistory &&
        !isInteractionBusy &&
        !topRequestLatchedRef.current
      ) {
        topRequestLatchedRef.current = true;
        captureHistoryAnchor();
        void onLoadNextHistoryPage();
        return;
      }

      if (
        isNearBottom &&
        hasNextQueuePage &&
        !hasQueueError &&
        !isFetchingQueue &&
        !isInteractionBusy &&
        !bottomRequestLatchedRef.current
      ) {
        bottomRequestLatchedRef.current = true;
        void onLoadNextQueuePage();
      }
    },
    [
      activeTab,
      captureHistoryAnchor,
      getCurrentAnchor,
      hasHistoryError,
      hasNextHistoryPage,
      hasNextQueuePage,
      hasQueueError,
      isFetchingHistory,
      isFetchingQueue,
      isInteractionBusy,
      onLoadNextHistoryPage,
      onLoadNextQueuePage,
    ],
  );

  const handleReturnToCurrent = useCallback(() => {
    keepCurrentAlignedRef.current = true;
    alignCurrentToTop();
    void onResetHistoryToLatestPage();
  }, [alignCurrentToTop, onResetHistoryToLatestPage]);

  const handleRetryHistory = useCallback(() => {
    if (activeTab === "all") {
      captureHistoryAnchor();
      topRequestLatchedRef.current = true;
    }
    void onRetryHistoryPage();
  }, [activeTab, captureHistoryAnchor, onRetryHistoryPage]);

  useLayoutEffect(() => {
    pendingHistoryAnchorRef.current = null;
    topRequestLatchedRef.current = false;
    bottomRequestLatchedRef.current = false;
    keepCurrentAlignedRef.current = activeTab === "all";
    isCurrentAlignedRef.current = false;
    updateTailSpacer();
    alignCurrentToTop();
  }, [
    activeTab,
    alignCurrentToTop,
    currentEntryId,
    updateTailSpacer,
  ]);

  useLayoutEffect(() => {
    updateTailAndRestoreCurrent();
  }, [
    hasQueueError,
    historyEntryIds,
    isFetchingQueue,
    queueEntryIds,
    updateTailAndRestoreCurrent,
  ]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const handleResize = () => updateTailAndRestoreCurrent();
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(handleResize);
    resizeObserver?.observe(container);
    window.addEventListener("resize", handleResize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [updateTailAndRestoreCurrent]);

  useLayoutEffect(() => {
    if (isFetchingHistory) {
      return;
    }

    const container = scrollContainerRef.current;
    const snapshot = pendingHistoryAnchorRef.current;
    if (container && snapshot) {
      const nextIndex = historyEntryIds.indexOf(snapshot.historyId);
      const retainedRow = container.querySelector<HTMLElement>(
        `[data-queue-history-id="${snapshot.historyId}"]`,
      );

      if (retainedRow) {
        container.scrollTop +=
          getElementOffsetFromContainer(retainedRow, container) -
          snapshot.rowOffset;
      } else if (nextIndex >= 0 && snapshot.rowHeight > 0) {
        container.scrollTop =
          snapshot.scrollTop +
          (nextIndex - snapshot.historyIndex) * snapshot.rowHeight;
      } else {
        container.scrollTop =
          snapshot.scrollTop +
          (container.scrollHeight - snapshot.scrollHeight);
      }
      pendingHistoryAnchorRef.current = null;
    } else if (
      activeTab === "all" &&
      previousHistoryLengthRef.current === 0 &&
      historyEntryIds.length > 0
    ) {
      alignCurrentToTop();
    }

    if (keepCurrentAlignedRef.current) {
      alignCurrentToTop();
      keepCurrentAlignedRef.current = false;
    }
    previousHistoryLengthRef.current = historyEntryIds.length;
  }, [
    activeTab,
    alignCurrentToTop,
    historyEntryIds,
    isFetchingHistory,
  ]);

  return {
    handleReturnToCurrent,
    handleRetryHistory,
    handleScroll,
    scrollContainerRef,
  };
}
