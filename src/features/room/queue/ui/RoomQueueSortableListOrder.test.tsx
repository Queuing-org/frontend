import { act, fireEvent, render, screen } from "@testing-library/react";
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

let activeSortableId: string | null = null;

vi.mock("@dnd-kit/core", () => ({
  closestCenter: vi.fn(),
  DndContext: ({
    children,
    onDragEnd,
    onDragStart,
  }: {
    children: ReactNode;
    onDragEnd: (event: {
      active: { id: string };
      over: { id: string };
    }) => void;
    onDragStart: (event: { active: { id: string } }) => void;
  }) => (
    <>
      <button
        type="button"
        onClick={() => {
          activeSortableId = "a";
          onDragStart({ active: { id: "a" } });
        }}
      >
        drag start
      </button>
      <button
        type="button"
        onClick={() => {
          activeSortableId = null;
          onDragEnd({ active: { id: "a" }, over: { id: "b" } })
        }}
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
  useSortable: vi.fn(({ id }: { id: string }) => ({
    attributes: {},
    isDragging: activeSortableId === id,
    listeners: {},
    setNodeRef: vi.fn(),
    transform:
      activeSortableId === null
        ? null
        : { scaleX: 1, scaleY: 1, x: 0, y: 80 },
    transition: activeSortableId === null ? undefined : "transform 200ms ease",
  })),
  verticalListSortingStrategy: {},
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: vi.fn((transform) =>
        transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      ),
    },
  },
}));

const entry = (entryId: string): PlaylistEntry => ({
  addedBy: { avatarUrl: null, nickname: "나", slug: "me" },
  createdAtMs: 1,
  entryId,
  order: 1,
  status: {
    isActive: false,
    isPlayed: false,
    ownerOrdered: false,
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
        onMove={onMove}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "drag start" }));
    expect(screen.getByLabelText("a 순서 변경").closest("li")).toHaveStyle({
      transform: "translate3d(0px, 80px, 0)",
    });

    fireEvent.click(screen.getByRole("button", { name: "drag end" }));
    expect(getRowOrder(container)).toEqual(["b", "a"]);

    rerender(
      <RoomQueueSortableList
        emptyMessage="비었음"
        entries={[entry("a"), entry("b")]}
        isMovePending
        onMove={onMove}
      />,
    );
    expect(getRowOrder(container)).toEqual(["b", "a"]);

    await act(async () => {
      failMove();
      await moveCompletion.catch(() => undefined);
    });

    expect(getRowOrder(container)).toEqual(["a", "b"]);
    expect(container.querySelectorAll("li")).toHaveLength(2);
    container.querySelectorAll("li").forEach((row) => {
      expect(row.style.transform).toBe("");
      expect(row).toHaveAttribute("data-dragging", "false");
    });
  });
});
