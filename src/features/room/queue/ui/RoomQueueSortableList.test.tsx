import { render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import type { PlaylistEntry } from "@/src/features/playlist/model/types";
import RoomQueueSortableList from "./RoomQueueSortableList";

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

const entry = (entryId: string, ownerOrderLocked: boolean): PlaylistEntry => ({
  order: 1,
  track: {
    title: entryId,
    videoId: entryId,
    provider: "YOUTUBE",
    durationMs: 1,
    thumbnailUrl: null,
  },
  status: {
    skipped: false,
    isActive: false,
    isPlayed: false,
    ownerOrderLocked,
  },
  addedBy: { slug: "me", nickname: "나", avatarUrl: null },
  entryId,
  createdAtMs: 1,
  updatedAtMs: 1,
});

describe("RoomQueueSortableList", () => {
  it("개인 순서에서는 고정곡을 앞에 두고 이동 기능을 제공하지 않는다", () => {
    const { container } = render(
      <RoomQueueSortableList
        emptyMessage="비었음"
        entries={[entry("locked", true), entry("a", false), entry("b", false)]}
        moveMode="self"
      />,
    );

    const rows = [...container.querySelectorAll("li")];
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("locked"),
      expect.stringContaining("a"),
      expect.stringContaining("b"),
    ]);
    expect(rows[0]).toHaveAttribute("data-drag-disabled", "true");
    expect(
      screen.queryByLabelText("locked 순서 변경"),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("a 순서 변경")).toBeInTheDocument();
  });

  it("방장 순서에서는 고정곡도 이동 대상으로 포함한다", () => {
    render(
      <RoomQueueSortableList
        emptyMessage="비었음"
        entries={[entry("locked", true), entry("a", false)]}
        moveMode="owner"
      />,
    );

    expect(screen.getByLabelText("locked 순서 변경")).toBeInTheDocument();
  });
});
