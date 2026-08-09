import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PlaylistEntry } from "@/src/features/playlist/model/types";
import RoomQueueList from "./RoomQueueList";
import RoomQueueSortableList from "./RoomQueueSortableList";
import {
  getQueueRenderWindow,
  QUEUE_MAX_MOUNTED_ITEMS_PER_LIST,
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
      ownerOrderLocked: false,
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

  it("sortable queue도 전체 항목 대신 render window만 useSortable로 등록한다", () => {
    const { container } = render(
      <div data-queue-scroll-container>
        <RoomQueueSortableList
          emptyMessage="비어 있음"
          entries={createEntries(500)}
          moveMode="owner"
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
          moveMode="owner"
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
