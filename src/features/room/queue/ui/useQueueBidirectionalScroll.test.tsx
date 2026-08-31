import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { QueueTab } from "../model/roomQueue";
import {
  getQueueTailHeight,
  useQueueBidirectionalScroll,
} from "./useQueueBidirectionalScroll";

type HarnessProps = {
  activeTab?: QueueTab;
  currentEntryId?: string | null;
  currentTop?: number;
  contentEndTop?: number;
  containerHeight?: number;
  clampScrollTop?: boolean;
  hasHistoryError?: boolean;
  hasNextHistoryPage?: boolean;
  hasNextQueuePage?: boolean;
  hasQueueError?: boolean;
  historyEntryIds?: number[];
  isFetchingHistory?: boolean;
  isFetchingQueue?: boolean;
  isInteractionBusy?: boolean;
  onLoadNextHistoryPage?: () => unknown;
  onLoadNextQueuePage?: () => unknown;
  onResetHistoryToLatestPage?: () => unknown;
  onRetryHistoryPage?: () => unknown;
  queueEntryIds?: string[];
};

function rect(top: number, height: number): DOMRect {
  return {
    bottom: top + height,
    height,
    left: 0,
    right: 320,
    top,
    width: 320,
    x: 0,
    y: top,
    toJSON: () => ({}),
  };
}

function Harness({
  activeTab = "all",
  currentEntryId = "current",
  currentTop = 300,
  contentEndTop = currentTop + 74,
  containerHeight = 300,
  clampScrollTop = false,
  hasHistoryError = false,
  hasNextHistoryPage = false,
  hasNextQueuePage = false,
  hasQueueError = false,
  historyEntryIds = [],
  isFetchingHistory = false,
  isFetchingQueue = false,
  isInteractionBusy = false,
  onLoadNextHistoryPage = () => undefined,
  onLoadNextQueuePage = () => undefined,
  onResetHistoryToLatestPage = () => undefined,
  onRetryHistoryPage = () => undefined,
  queueEntryIds = [],
}: HarnessProps) {
  const { handleRetryHistory, handleScroll, scrollContainerRef } =
    useQueueBidirectionalScroll({
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
    });

  return (
    <div
      ref={(node) => {
        scrollContainerRef.current = node;
        if (node) {
          const previousScrollTop = node.scrollTop;
          Object.defineProperty(node, "clientHeight", {
            configurable: true,
            value: containerHeight,
          });
          if (clampScrollTop) {
            const tailHeight = Number.parseFloat(
              node.querySelector<HTMLElement>("[data-queue-tail-spacer]")
                ?.style.height || "0",
            );
            let scrollTop = Math.min(
              previousScrollTop,
              Math.max(
                0,
                contentEndTop + tailHeight - containerHeight,
              ),
            );
            Object.defineProperty(node, "scrollTop", {
              configurable: true,
              get: () => scrollTop,
              set: (nextScrollTop: number) => {
                const nextTailHeight = Number.parseFloat(
                  node.querySelector<HTMLElement>(
                    "[data-queue-tail-spacer]",
                  )?.style.height || "0",
                );
                scrollTop = Math.max(
                  0,
                  Math.min(
                    nextScrollTop,
                    contentEndTop + nextTailHeight - containerHeight,
                  ),
                );
              },
            });
          }
        }
      }}
      data-testid="scroll-container"
      data-queue-scroll-container
      onScroll={handleScroll}
    >
      {historyEntryIds.map((historyId, index) => (
        <div
          key={historyId}
          data-absolute-top={index * 74}
          data-queue-history-id={historyId}
        />
      ))}
      <div
        data-absolute-top={currentTop}
        data-queue-current-boundary
      />
      {currentEntryId ? (
        <div
          data-absolute-top={currentTop}
          data-queue-current-anchor={currentEntryId}
        />
      ) : null}
      <div data-absolute-top={contentEndTop} data-queue-content-end />
      <div data-testid="queue-tail" data-queue-tail-spacer />
      <button
        type="button"
        data-testid="retry-history"
        onClick={handleRetryHistory}
      />
    </div>
  );
}

function setScrollDimensions(
  container: HTMLElement,
  { clientHeight, scrollHeight }: { clientHeight: number; scrollHeight: number },
) {
  Object.defineProperties(container, {
    clientHeight: { configurable: true, value: clientHeight },
    scrollHeight: { configurable: true, value: scrollHeight },
  });
}

describe("useQueueBidirectionalScroll", () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function getBoundingClientRect(this: HTMLElement) {
        if (this.hasAttribute("data-queue-scroll-container")) {
          return rect(0, 300);
        }
        const container = this.closest<HTMLElement>(
          "[data-queue-scroll-container]",
        );
        const absoluteTop = Number(this.dataset.absoluteTop ?? 0);
        const top = absoluteTop - (container?.scrollTop ?? 0);
        return rect(top, this.dataset.queueHistoryId ? 74 : 0);
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("전체 탭 진입과 현재 곡 ID 변경 때 현재 행을 즉시 최상단에 맞춘다", () => {
    const { getByTestId, rerender } = render(
      <Harness currentEntryId="current-a" currentTop={222} />,
    );
    const container = getByTestId("scroll-container");

    expect(container.scrollTop).toBe(222);

    rerender(<Harness currentEntryId="current-b" currentTop={444} />);

    expect(container.scrollTop).toBe(444);
  });

  it("현재 곡이 없으면 history와 대기곡 사이 경계를 최상단에 맞춘다", () => {
    const { getByTestId } = render(
      <Harness currentEntryId={null} currentTop={180} />,
    );

    expect(getByTestId("scroll-container").scrollTop).toBe(180);
  });

  it("대기곡이 짧아도 현재 곡을 최상단에 둘 만큼 tail 공간을 만든다", () => {
    const { getByTestId } = render(
      <Harness currentTop={222} contentEndTop={296} />,
    );

    expect(getByTestId("queue-tail")).toHaveStyle({ height: "226px" });
    expect(
      getQueueTailHeight({
        anchorTop: 222,
        containerHeight: 300,
        contentEndTop: 296,
      }),
    ).toBe(226);
  });

  it("tail 앞 content가 줄며 scrollTop이 clamp돼도 현재 정렬을 복원한다", () => {
    const { getByTestId, rerender } = render(
      <Harness
        clampScrollTop
        currentTop={222}
        contentEndTop={296}
      />,
    );
    const container = getByTestId("scroll-container");
    expect(container.scrollTop).toBe(222);

    rerender(
      <Harness
        clampScrollTop
        currentTop={222}
        contentEndTop={266}
      />,
    );

    expect(getByTestId("queue-tail")).toHaveStyle({ height: "256px" });
    expect(container.scrollTop).toBe(222);
  });

  it("내 신청곡 탭에서는 곡 변경과 탭을 유지하고 전체 탭 복귀 때만 정렬한다", () => {
    const { getByTestId, rerender } = render(
      <Harness activeTab="mine" currentEntryId="current-a" currentTop={222} />,
    );
    const container = getByTestId("scroll-container");
    container.scrollTop = 55;

    rerender(
      <Harness activeTab="mine" currentEntryId="current-b" currentTop={444} />,
    );
    expect(container.scrollTop).toBe(55);

    rerender(
      <Harness activeTab="all" currentEntryId="current-b" currentTop={444} />,
    );
    expect(container.scrollTop).toBe(444);
  });

  it("history prepend 뒤 같은 ID 행의 화면 위치를 보존한다", () => {
    const loadHistory = vi.fn();
    const { getByTestId, rerender } = render(
      <Harness
        currentTop={222}
        hasNextHistoryPage
        historyEntryIds={[3, 4, 5]}
        onLoadNextHistoryPage={loadHistory}
      />,
    );
    const container = getByTestId("scroll-container");
    setScrollDimensions(container, { clientHeight: 300, scrollHeight: 522 });
    container.scrollTop = 0;

    fireEvent.scroll(container);
    fireEvent.scroll(container);
    expect(loadHistory).toHaveBeenCalledOnce();

    rerender(
      <Harness
        currentTop={370}
        hasNextHistoryPage
        historyEntryIds={[3, 4, 5]}
        isFetchingHistory
        onLoadNextHistoryPage={loadHistory}
      />,
    );
    rerender(
      <Harness
        currentTop={370}
        hasNextHistoryPage
        historyEntryIds={[1, 2, 3, 4, 5]}
        onLoadNextHistoryPage={loadHistory}
      />,
    );

    expect(container.scrollTop).toBe(148);
  });

  it("prepend와 최신쪽 sliding eviction이 동시에 일어나도 같은 행을 보존한다", () => {
    const loadHistory = vi.fn();
    const { getByTestId, rerender } = render(
      <Harness
        currentTop={222}
        hasNextHistoryPage
        historyEntryIds={[3, 4, 5]}
        onLoadNextHistoryPage={loadHistory}
      />,
    );
    const container = getByTestId("scroll-container");
    setScrollDimensions(container, { clientHeight: 300, scrollHeight: 300 });
    container.scrollTop = 0;
    fireEvent.scroll(container);

    rerender(
      <Harness
        currentTop={222}
        hasNextHistoryPage
        historyEntryIds={[3, 4, 5]}
        isFetchingHistory
        onLoadNextHistoryPage={loadHistory}
      />,
    );
    rerender(
      <Harness
        currentTop={222}
        hasNextHistoryPage
        historyEntryIds={[1, 2, 3]}
        onLoadNextHistoryPage={loadHistory}
      />,
    );

    expect(container.scrollTop).toBe(148);
  });

  it("곡이 바뀐 동안 끝난 history 요청은 이전 anchor로 되돌리지 않는다", () => {
    const loadHistory = vi.fn();
    const { getByTestId, rerender } = render(
      <Harness
        currentEntryId="current-a"
        currentTop={222}
        hasNextHistoryPage
        historyEntryIds={[3, 4, 5]}
        onLoadNextHistoryPage={loadHistory}
      />,
    );
    const container = getByTestId("scroll-container");
    setScrollDimensions(container, { clientHeight: 300, scrollHeight: 522 });
    container.scrollTop = 0;
    fireEvent.scroll(container);

    rerender(
      <Harness
        currentEntryId="current-b"
        currentTop={444}
        hasNextHistoryPage
        historyEntryIds={[3, 4, 5]}
        isFetchingHistory
        onLoadNextHistoryPage={loadHistory}
      />,
    );
    rerender(
      <Harness
        currentEntryId="current-b"
        currentTop={592}
        hasNextHistoryPage
        historyEntryIds={[1, 2, 3, 4, 5]}
        onLoadNextHistoryPage={loadHistory}
      />,
    );

    expect(container.scrollTop).toBe(592);
  });

  it("history 요청 중 mine 탭으로 바꾸면 이전 anchor 보정을 폐기한다", () => {
    const loadHistory = vi.fn();
    const { getByTestId, rerender } = render(
      <Harness
        currentTop={222}
        hasNextHistoryPage
        historyEntryIds={[3, 4, 5]}
        onLoadNextHistoryPage={loadHistory}
      />,
    );
    const container = getByTestId("scroll-container");
    setScrollDimensions(container, { clientHeight: 300, scrollHeight: 522 });
    container.scrollTop = 0;
    fireEvent.scroll(container);

    rerender(
      <Harness
        activeTab="mine"
        currentTop={222}
        hasNextHistoryPage
        historyEntryIds={[3, 4, 5]}
        isFetchingHistory
        onLoadNextHistoryPage={loadHistory}
      />,
    );
    container.scrollTop = 55;
    rerender(
      <Harness
        activeTab="mine"
        currentTop={370}
        hasNextHistoryPage
        historyEntryIds={[1, 2, 3, 4, 5]}
        onLoadNextHistoryPage={loadHistory}
      />,
    );

    expect(container.scrollTop).toBe(55);
  });

  it("history 재시도도 prepend 전 anchor를 보존한다", () => {
    const retryHistory = vi.fn();
    const { getByTestId, rerender } = render(
      <Harness
        currentTop={222}
        hasHistoryError
        hasNextHistoryPage
        historyEntryIds={[3, 4, 5]}
        onRetryHistoryPage={retryHistory}
      />,
    );
    const container = getByTestId("scroll-container");
    setScrollDimensions(container, { clientHeight: 300, scrollHeight: 522 });
    container.scrollTop = 0;

    fireEvent.click(getByTestId("retry-history"));
    expect(retryHistory).toHaveBeenCalledOnce();

    rerender(
      <Harness
        currentTop={222}
        hasHistoryError
        hasNextHistoryPage
        historyEntryIds={[3, 4, 5]}
        isFetchingHistory
        onRetryHistoryPage={retryHistory}
      />,
    );
    rerender(
      <Harness
        currentTop={370}
        hasNextHistoryPage
        historyEntryIds={[1, 2, 3, 4, 5]}
        onRetryHistoryPage={retryHistory}
      />,
    );

    expect(container.scrollTop).toBe(148);
  });

  it("상·하단 경계마다 한 요청만 보내고 경계를 벗어나면 latch를 해제한다", () => {
    const loadHistory = vi.fn();
    const loadQueue = vi.fn();
    const { getByTestId } = render(
      <Harness
        contentEndTop={1_000}
        hasNextHistoryPage
        hasNextQueuePage
        historyEntryIds={[1, 2, 3]}
        onLoadNextHistoryPage={loadHistory}
        onLoadNextQueuePage={loadQueue}
      />,
    );
    const container = getByTestId("scroll-container");
    setScrollDimensions(container, { clientHeight: 300, scrollHeight: 1_000 });

    container.scrollTop = 50;
    fireEvent.scroll(container);
    fireEvent.scroll(container);
    expect(loadHistory).toHaveBeenCalledOnce();

    container.scrollTop = 200;
    fireEvent.scroll(container);
    container.scrollTop = 50;
    fireEvent.scroll(container);
    expect(loadHistory).toHaveBeenCalledTimes(2);

    container.scrollTop = 650;
    fireEvent.scroll(container);
    fireEvent.scroll(container);
    expect(loadQueue).toHaveBeenCalledOnce();
  });

  it("드래그·mutation 처리 중에는 양쪽 자동 조회를 막는다", () => {
    const loadHistory = vi.fn();
    const loadQueue = vi.fn();
    const { getByTestId } = render(
      <Harness
        contentEndTop={1_000}
        hasNextHistoryPage
        hasNextQueuePage
        historyEntryIds={[1, 2, 3]}
        isInteractionBusy
        onLoadNextHistoryPage={loadHistory}
        onLoadNextQueuePage={loadQueue}
      />,
    );
    const container = getByTestId("scroll-container");
    setScrollDimensions(container, { clientHeight: 300, scrollHeight: 1_000 });

    container.scrollTop = 50;
    fireEvent.scroll(container);
    container.scrollTop = 650;
    fireEvent.scroll(container);

    expect(loadHistory).not.toHaveBeenCalled();
    expect(loadQueue).not.toHaveBeenCalled();
  });
});
