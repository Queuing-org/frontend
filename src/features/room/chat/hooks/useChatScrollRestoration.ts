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
  messageKeys: readonly string[];
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

export function getLeadingMessageRemovalOffset(
  previousMessageKeys: readonly string[],
  currentFirstMessageKey: string | undefined,
  previousOffsets: ReadonlyMap<string, number>,
) {
  if (!currentFirstMessageKey || previousMessageKeys[0] === currentFirstMessageKey) {
    return 0;
  }

  const previousFirstOffset = previousOffsets.get(previousMessageKeys[0] ?? "");
  const currentFirstPreviousOffset = previousOffsets.get(currentFirstMessageKey);

  if (
    typeof previousFirstOffset !== "number" ||
    typeof currentFirstPreviousOffset !== "number"
  ) {
    return 0;
  }

  return Math.max(0, currentFirstPreviousOffset - previousFirstOffset);
}

export function useChatScrollRestoration({
  externalWheelRegionRef,
  hasOlderMessages,
  isLoadingOlderMessages,
  messageKeys,
  onLoadOlderMessages,
  scrollToLatestKey,
}: UseChatScrollRestorationParams) {
  const listRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLOListElement>(null);
  const wheelRegionRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const restoreScrollRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);
  const previousMessageLayoutRef = useRef<{
    keys: readonly string[];
    offsets: ReadonlyMap<string, number>;
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
    } else if (shouldStickToBottomRef.current) {
      list.scrollTop = list.scrollHeight;
    } else if (previousMessageLayoutRef.current) {
      const removedHeight = getLeadingMessageRemovalOffset(
        previousMessageLayoutRef.current.keys,
        messageKeys[0],
        previousMessageLayoutRef.current.offsets,
      );
      if (removedHeight > 0) {
        list.scrollTop = Math.max(0, list.scrollTop - removedHeight);
      }
    }

    previousMessageLayoutRef.current = {
      keys: messageKeys,
      offsets: new Map(
        Array.from(
          list.querySelectorAll<HTMLElement>("[data-chat-message-key]"),
        ).flatMap((element) => {
          const messageKey = element.dataset.chatMessageKey;
          return messageKey ? [[messageKey, element.offsetTop] as const] : [];
        }),
      ),
    };
  }, [isLoadingOlderMessages, messageKeys]);

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
    const list = listRef.current;
    const messages = messagesRef.current;
    if (!list || !messages) {
      return;
    }

    let frameId: number | null = null;
    const alignLatestMessage = () => {
      if (!shouldStickToBottomRef.current) {
        return;
      }

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      frameId = requestAnimationFrame(() => {
        frameId = null;
        if (shouldStickToBottomRef.current) {
          list.scrollTop = list.scrollHeight;
        }
      });
    };

    alignLatestMessage();
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(alignLatestMessage);
    resizeObserver?.observe(messages);

    return () => {
      resizeObserver?.disconnect();
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [messageKeys]);

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
    messagesRef,
    requestOlderMessages,
    wheelRegionRef,
  };
}
