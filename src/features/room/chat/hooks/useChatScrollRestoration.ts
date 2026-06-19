"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  type RefObject,
} from "react";

const LOAD_OLDER_THRESHOLD_PX = 72;
const STICKY_BOTTOM_THRESHOLD_PX = 96;
const INTERACTIVE_WHEEL_TARGET_SELECTOR =
  "button,a,input,textarea,select,[contenteditable='true']";

type UseChatScrollRestorationParams = {
  externalWheelRegionRef?: RefObject<HTMLElement | null>;
  hasOlderMessages: boolean;
  isLoadingOlderMessages: boolean;
  messageCount: number;
  onLoadOlderMessages: () => void;
  scrollToLatestKey: number;
};

function getNormalizedWheelDeltaY(event: WheelEvent, containerHeight: number) {
  if (event.deltaMode === 1) {
    return event.deltaY * 16;
  }

  if (event.deltaMode === 2) {
    return event.deltaY * containerHeight;
  }

  return event.deltaY;
}

function isScrollableY(element: HTMLElement) {
  const { overflowY } = window.getComputedStyle(element);

  return (
    (overflowY === "auto" || overflowY === "scroll") &&
    element.scrollHeight > element.clientHeight
  );
}

function canScrollElement(element: HTMLElement, deltaY: number) {
  const maxScrollTop = element.scrollHeight - element.clientHeight;

  if (maxScrollTop <= 0 || deltaY === 0) {
    return false;
  }

  if (deltaY < 0) {
    return element.scrollTop > 0;
  }

  return element.scrollTop < maxScrollTop;
}

function hasScrollableWheelTarget({
  boundary,
  deltaY,
  scrollList,
  target,
}: {
  boundary: HTMLElement;
  deltaY: number;
  scrollList: HTMLElement;
  target: EventTarget | null;
}) {
  if (!(target instanceof Element)) {
    return false;
  }

  let element: Element | null = target;

  while (element && element !== boundary) {
    if (element === scrollList) {
      return false;
    }

    if (
      element instanceof HTMLElement &&
      isScrollableY(element) &&
      canScrollElement(element, deltaY)
    ) {
      return true;
    }

    element = element.parentElement;
  }

  return false;
}

function hasInteractiveWheelTarget({
  boundary,
  target,
}: {
  boundary: HTMLElement;
  target: EventTarget | null;
}) {
  if (!(target instanceof Element)) {
    return false;
  }

  const interactiveTarget = target.closest(INTERACTIVE_WHEEL_TARGET_SELECTOR);

  return Boolean(interactiveTarget && boundary.contains(interactiveTarget));
}

function isWheelInsideRegion(event: WheelEvent, region: HTMLElement) {
  const rect = region.getBoundingClientRect();

  return (
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  );
}

export function useChatScrollRestoration({
  externalWheelRegionRef,
  hasOlderMessages,
  isLoadingOlderMessages,
  messageCount,
  onLoadOlderMessages,
  scrollToLatestKey,
}: UseChatScrollRestorationParams) {
  const listRef = useRef<HTMLDivElement>(null);
  const wheelRegionRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const restoreScrollRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);

  const requestOlderMessages = useCallback(() => {
    const list = listRef.current;
    if (!list || !hasOlderMessages || isLoadingOlderMessages) {
      return;
    }

    restoreScrollRef.current = {
      scrollHeight: list.scrollHeight,
      scrollTop: list.scrollTop,
    };
    onLoadOlderMessages();
  }, [hasOlderMessages, isLoadingOlderMessages, onLoadOlderMessages]);

  const handleScroll = useCallback(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    const distanceFromBottom =
      list.scrollHeight - list.scrollTop - list.clientHeight;
    shouldStickToBottomRef.current =
      distanceFromBottom < STICKY_BOTTOM_THRESHOLD_PX;

    if (list.scrollTop < LOAD_OLDER_THRESHOLD_PX) {
      requestOlderMessages();
    }
  }, [requestOlderMessages]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    if (restoreScrollRef.current && !isLoadingOlderMessages) {
      const { scrollHeight, scrollTop } = restoreScrollRef.current;
      list.scrollTop = list.scrollHeight - scrollHeight + scrollTop;
      restoreScrollRef.current = null;
      return;
    }

    if (shouldStickToBottomRef.current) {
      list.scrollTop = list.scrollHeight;
    }
  }, [isLoadingOlderMessages, messageCount]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    restoreScrollRef.current = null;
    shouldStickToBottomRef.current = true;
    list.scrollTop = list.scrollHeight;
  }, [scrollToLatestKey]);

  useLayoutEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        return;
      }

      const ownRegion = wheelRegionRef.current;
      const region = externalWheelRegionRef?.current ?? ownRegion;
      const list = listRef.current;

      if (!region || !ownRegion || !list || !isWheelInsideRegion(event, region)) {
        return;
      }

      if (event.target instanceof Element && !region.contains(event.target)) {
        return;
      }

      const deltaY = getNormalizedWheelDeltaY(event, list.clientHeight);

      if (region !== ownRegion) {
        const ownRegionRect = ownRegion.getBoundingClientRect();

        if (event.clientY < ownRegionRect.top) {
          return;
        }
      }

      if (hasInteractiveWheelTarget({ boundary: region, target: event.target })) {
        return;
      }

      if (
        hasScrollableWheelTarget({
          boundary: region,
          deltaY,
          scrollList: list,
          target: event.target,
        })
      ) {
        return;
      }

      if (!canScrollElement(list, deltaY)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      list.scrollBy({ top: deltaY, behavior: "auto" });
      window.requestAnimationFrame(handleScroll);
    };

    const wheelListenerOptions = { capture: true, passive: false };

    document.addEventListener("wheel", handleWheel, wheelListenerOptions);

    return () => {
      document.removeEventListener("wheel", handleWheel, wheelListenerOptions);
    };
  }, [externalWheelRegionRef, handleScroll]);

  return {
    handleScroll,
    listRef,
    requestOlderMessages,
    wheelRegionRef,
  };
}
