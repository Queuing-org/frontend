import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlaylistEntry } from "@/src/features/playlist/model/types";
import RoomQueueSortableList from "./RoomQueueSortableList";

vi.mock("next/image", () => ({
  default: ({ alt }: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} />
  ),
}));

class PointerEventMock extends MouseEvent {
  isPrimary: boolean;
  pointerId: number;

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.isPrimary = init.isPrimary ?? true;
    this.pointerId = init.pointerId ?? 1;
  }
}

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

describe("RoomQueueSortableList pointer drag", () => {
  beforeEach(() => {
    vi.stubGlobal("PointerEvent", PointerEventMock);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function getBoundingClientRect() {
        if (this.tagName === "LI") {
          const rows = this.parentElement
            ? [...this.parentElement.querySelectorAll("li")]
            : [];
          const index = rows.indexOf(this);
          return rect(Math.max(0, index) * 74, 74);
        }

        return rect(0, 300);
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("연속 pointer drop 후 원본 행의 수·가시성·inline transform을 복구한다", async () => {
    const onMove = vi.fn(() => Promise.resolve());
    const { container } = render(
      <RoomQueueSortableList
        emptyMessage="비었음"
        entries={[entry("a"), entry("b"), entry("c")]}
        moveMode="owner"
        onMove={onMove}
      />,
    );

    for (let cycle = 0; cycle < 3; cycle += 1) {
      const handle = screen.getByLabelText("a 순서 변경");
      fireEvent.pointerDown(handle, {
        button: 0,
        clientX: 20,
        clientY: 37,
        isPrimary: true,
        pointerId: cycle + 1,
      });
      fireEvent.pointerMove(document, {
        button: 0,
        clientX: 20,
        clientY: 125,
        isPrimary: true,
        pointerId: cycle + 1,
      });

      await waitFor(() => {
        expect(handle.closest("li")).toHaveAttribute("data-dragging", "true");
      });

      fireEvent.pointerMove(document, {
        button: 0,
        buttons: 1,
        clientX: 20,
        clientY: 135,
        isPrimary: true,
        pointerId: cycle + 1,
      });
      await act(async () => {
        await Promise.resolve();
      });

      fireEvent.pointerUp(document, {
        button: 0,
        clientX: 20,
        clientY: 135,
        isPrimary: true,
        pointerId: cycle + 1,
      });

      await act(async () => {
        await Promise.resolve();
      });

      const rows = [...container.querySelectorAll("li")];
      expect(rows).toHaveLength(3);
      rows.forEach((row) => {
        const computedStyle = window.getComputedStyle(row);
        expect(row).toHaveAttribute("data-dragging", "false");
        expect(computedStyle.opacity).toBe("1");
        expect(computedStyle.visibility).toBe("visible");
        expect(row.style.transform).toBe("");
        expect(row.style.transition).toBe("");
        expect(row.style.animation).toBe("");
      });
      expect(container.querySelector("ul")).toHaveAttribute(
        "data-render-window",
        "virtualized",
      );
    }

    expect(onMove).toHaveBeenCalledTimes(3);
  });
});
