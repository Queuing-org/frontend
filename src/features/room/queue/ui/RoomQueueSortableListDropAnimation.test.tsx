import { render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { PlaylistEntry } from "@/src/features/playlist/model/types";
import RoomQueueSortableList from "./RoomQueueSortableList";

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

vi.mock("@dnd-kit/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dnd-kit/core")>();

  return {
    ...actual,
    DragOverlay: ({
      children,
      dropAnimation,
    }: {
      children: ReactNode;
      dropAnimation?: unknown;
    }) => (
      <div
        data-testid="queue-drag-overlay"
        data-drop-animation={dropAnimation === null ? "disabled" : "enabled"}
      >
        {children}
      </div>
    ),
  };
});

const entry = (entryId: string): PlaylistEntry => ({
  addedBy: { avatarUrl: null, nickname: "나", slug: "me" },
  createdAtMs: 1,
  entryId,
  order: 1,
  status: {
    isActive: false,
    isPlayed: false,
    ownerOrderLocked: false,
    skipped: false,
  },
  track: {
    durationMs: 1,
    provider: "YOUTUBE",
    thumbnailUrl: null,
    title: entryId,
    videoId: entryId,
  },
  updatedAtMs: 1,
});

describe("RoomQueueSortableList drag overlay", () => {
  it("연속 드래그 뒤 원본 행을 숨길 수 있는 drop animation을 사용하지 않는다", () => {
    render(
      <RoomQueueSortableList
        emptyMessage="비었음"
        entries={[entry("a"), entry("b")]}
        moveMode="owner"
      />,
    );

    expect(screen.getByTestId("queue-drag-overlay")).toHaveAttribute(
      "data-drop-animation",
      "disabled",
    );
  });
});
