import { act, fireEvent, render } from "@testing-library/react";
import type { ImgHTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { PlaylistEntry } from "@/src/features/playlist/model/types";
import RoomQueueSortableList from "./RoomQueueSortableList";

vi.mock("next/image", () => ({
  default: ({ alt }: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} />
  ),
}));

vi.mock("@dnd-kit/core", () => ({
  closestCenter: vi.fn(),
  DndContext: ({
    children,
    onDragEnd,
  }: {
    children: ReactNode;
    onDragEnd: (event: {
      active: { id: string };
      over: { id: string };
    }) => void;
  }) => (
    <>
      <button
        type="button"
        onClick={() =>
          onDragEnd({ active: { id: "a" }, over: { id: "b" } })
        }
      >
        drag end
      </button>
      {children}
    </>
  ),
  DragOverlay: ({ children }: { children: ReactNode }) => children,
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
}));

vi.mock("@dnd-kit/sortable", () => ({
  arrayMove: <T,>(items: T[], from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  },
  SortableContext: ({ children }: { children: ReactNode }) => children,
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    isDragging: false,
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
  })),
  verticalListSortingStrategy: {},
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: vi.fn(() => undefined) } },
}));

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

function getRowOrder(container: HTMLElement) {
  return [...container.querySelectorAll("li")].map((row) =>
    row.textContent?.includes("a") ? "a" : "b",
  );
}

describe("RoomQueueSortableList optimistic order", () => {
  it("이동 실패 완료 후 rollback된 props 순서를 로컬 순서가 다시 덮지 않는다", async () => {
    let failMove = () => {};
    const moveCompletion = new Promise<void>((_resolve, reject) => {
      failMove = () => reject(new Error("이동 실패"));
    });
    const onMove = vi.fn(() => moveCompletion);
    const { container, rerender } = render(
      <RoomQueueSortableList
        emptyMessage="비었음"
        entries={[entry("a"), entry("b")]}
        moveMode="owner"
        onMove={onMove}
      />,
    );

    fireEvent.click(container.querySelector("button")!);
    expect(getRowOrder(container)).toEqual(["b", "a"]);

    rerender(
      <RoomQueueSortableList
        emptyMessage="비었음"
        entries={[entry("a"), entry("b")]}
        isMovePending
        moveMode="owner"
        onMove={onMove}
      />,
    );
    expect(getRowOrder(container)).toEqual(["b", "a"]);

    await act(async () => {
      failMove();
      await moveCompletion.catch(() => undefined);
    });

    expect(getRowOrder(container)).toEqual(["a", "b"]);
  });
});
