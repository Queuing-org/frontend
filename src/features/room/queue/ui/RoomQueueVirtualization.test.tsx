import { fireEvent, render, waitFor } from "@testing-library/react";
import { useLayoutEffect, useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import type {
  PlaylistEntry,
  RoomQueueHistoryEntry,
} from "@/src/features/playlist/model/types";
import RoomQueueHistoryList from "./RoomQueueHistoryList";
import RoomQueueList from "./RoomQueueList";
import RoomQueueSortableList from "./RoomQueueSortableList";
import {
  getQueueRenderWindow,
  QUEUE_MAX_MOUNTED_ITEMS_PER_LIST,
  resizeQueueRenderWindow,
} from "./useQueueRenderWindow";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span aria-label={alt} />,
}));
vi.mock("@/src/features/room/ui/OverflowMarquee", () => ({
  default: ({ text }: { text: string }) => <span>{text}</span>,
}));

function createEntries(count: number): PlaylistEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    addedBy: {
      avatarUrl: null,
      nickname: `신청자 ${index}`,
      slug: `user-${index}`,
    },
    createdAtMs: index,
    entryId: `entry-${index}`,
    order: index,
    status: {
      isActive: false,
      isPlayed: false,
      ownerOrdered: false,
      skipped: false,
    },
    track: {
      durationMs: 180_000,
      provider: "YOUTUBE",
      thumbnailUrl: null,
      title: `곡 ${index}`,
      videoId: `video-${index}`,
    },
    updatedAtMs: index,
  }));
}

function createHistoryEntries(count: number): RoomQueueHistoryEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    addedByUserSlug: null,
    durationMs: 180_000,
    endedAtMs: index,
    entryId: `history-entry-${index}`,
    id: index,
    provider: "YOUTUBE",
    queuedAtMs: null,
    skipped: false,
    playbackOrigin: "USER_REQUESTED",
    startOffsetMs: 0,
    startedAtMs: null,
    thumbnailUrl: null,
    title: `지난 곡 ${index}`,
    videoId: `history-video-${index}`,
  }));
}

function getRenderedHistoryHeight(container: HTMLElement) {
  const historyList = container.querySelector('[aria-label="지난 곡"]');
  if (!historyList) {
    return 0;
  }

  return Array.from(historyList.children).reduce((height, child) => {
    const element = child as HTMLElement;
    return height +
      (element.dataset.queueHistoryItem === "true"
        ? 74
        : Number.parseFloat(element.style.height) || 0);
  }, 0);
}

function HistoryGeometryProbe({
  entries,
  onLayout,
}: {
  entries: RoomQueueHistoryEntry[];
  onLayout: (height: number) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (rootRef.current) {
      onLayout(getRenderedHistoryHeight(rootRef.current));
    }
  }, [entries, onLayout]);

  return (
    <div ref={rootRef} data-queue-scroll-container>
      <RoomQueueHistoryList entries={entries} />
    </div>
  );
}

describe("queue render window", () => {
  it("매우 큰 viewport에서도 한 목록의 mounted item 상한을 지킨다", () => {
    const renderWindow = getQueueRenderWindow({
      itemCount: 500,
      listTop: 0,
      rowHeight: 74,
      scrollTop: 20_000,
      viewportHeight: 10_000,
    });

    expect(renderWindow.endIndex - renderWindow.startIndex).toBe(
      QUEUE_MAX_MOUNTED_ITEMS_PER_LIST,
    );
  });

  it("itemCount 변경 commit에서 기존 측정값으로 전체 geometry를 즉시 갱신한다", () => {
    const initialWindow = getQueueRenderWindow({
      itemCount: 100,
      listTop: 0,
      rowHeight: 74,
      scrollTop: 0,
      viewportHeight: 300,
    });

    const prependedWindow = resizeQueueRenderWindow(initialWindow, 200);

    expect(
      prependedWindow.paddingTop +
        (prependedWindow.endIndex - prependedWindow.startIndex) * 74 +
        prependedWindow.paddingBottom,
    ).toBe(200 * 74);
  });

  it("실제 history list가 0→100→200 변경의 spacer를 parent layout 전에 반영한다", () => {
    const observedHeights: number[] = [];
    const onLayout = (height: number) => observedHeights.push(height);
    const { rerender } = render(
      <HistoryGeometryProbe entries={[]} onLayout={onLayout} />,
    );

    rerender(
      <HistoryGeometryProbe
        entries={createHistoryEntries(100)}
        onLayout={onLayout}
      />,
    );
    expect(observedHeights.at(-1)).toBe(100 * 74);

    rerender(
      <HistoryGeometryProbe
        entries={createHistoryEntries(200)}
        onLayout={onLayout}
      />,
    );
    expect(observedHeights.at(-1)).toBe(200 * 74);
  });

  it("일반 queue 500개 중 render window만 카드 DOM으로 만든다", () => {
    const { container } = render(
      <div data-queue-scroll-container>
        <RoomQueueList
          emptyMessage="비어 있음"
          entries={createEntries(500)}
        />
      </div>,
    );

    expect(
      container.querySelectorAll('[data-queue-virtual-item="true"]'),
    ).toHaveLength(24);
  });

  it("history 500개도 최대 render window만 카드 DOM으로 만든다", () => {
    const { container } = render(
      <div data-queue-scroll-container>
        <RoomQueueHistoryList entries={createHistoryEntries(500)} />
      </div>,
    );

    expect(
      container.querySelectorAll('[data-queue-history-item="true"]'),
    ).toHaveLength(24);
    expect(
      container.querySelectorAll('[data-queue-history-item="true"]')
        .length,
    ).toBeLessThanOrEqual(QUEUE_MAX_MOUNTED_ITEMS_PER_LIST);
  });

  it("sortable queue도 전체 항목 대신 render window만 useSortable로 등록한다", () => {
    const { container } = render(
      <div data-queue-scroll-container>
        <RoomQueueSortableList
          emptyMessage="비어 있음"
          entries={createEntries(500)}
        />
      </div>,
    );

    expect(
      container.querySelectorAll('[data-queue-virtual-item="true"]'),
    ).toHaveLength(24);
  });

  it("drag 중에는 먼 구간 drop을 위해 sortable 항목 전체를 임시 mount한다", async () => {
    const { container } = render(
      <div data-queue-scroll-container>
        <RoomQueueSortableList
          emptyMessage="비어 있음"
          entries={createEntries(100)}
        />
      </div>,
    );
    const firstItem = container.querySelector<HTMLElement>(
      '[data-queue-virtual-item="true"]',
    );
    expect(firstItem).not.toBeNull();

    firstItem!.focus();
    fireEvent.keyDown(firstItem!, { code: "Space", key: " " });

    await waitFor(() =>
      expect(
        container.querySelector('[data-render-window="all-during-drag"]'),
      ).not.toBeNull(),
    );
    expect(
      container.querySelectorAll('[data-queue-virtual-item="true"]'),
    ).toHaveLength(100);

    fireEvent.keyDown(firstItem!, { code: "Escape", key: "Escape" });
    await waitFor(() =>
      expect(
        container.querySelector('[data-render-window="virtualized"]'),
      ).not.toBeNull(),
    );
  });
});
