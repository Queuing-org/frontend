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

const entry = (entryId: string, ownerOrdered: boolean): PlaylistEntry => ({
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
    ownerOrdered,
  },
  addedBy: { slug: "me", nickname: "나", avatarUrl: null },
  entryId,
  createdAtMs: 1,
  updatedAtMs: 1,
});

describe("RoomQueueSortableList", () => {
  it("ownerOrdered인 개인 pending 곡도 이동 기능을 제공한다", () => {
    const { container } = render(
      <RoomQueueSortableList
        emptyMessage="비었음"
        entries={[
          entry("owner-ordered", true),
          entry("a", false),
          entry("b", false),
        ]}
      />,
    );

    const rows = [...container.querySelectorAll("li")];
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("owner-ordered"),
      expect.stringContaining("a"),
      expect.stringContaining("b"),
    ]);
    expect(rows[0]).toHaveAttribute("data-drag-disabled", "false");
    expect(screen.getByLabelText("owner-ordered 순서 변경"))
      .toBeInTheDocument();
    expect(screen.getByLabelText("a 순서 변경")).toBeInTheDocument();
  });

  it("모든 pending 곡을 이동 대상으로 포함한다", () => {
    render(
      <RoomQueueSortableList
        emptyMessage="비었음"
        entries={[entry("owner-ordered", true), entry("a", false)]}
      />,
    );

    expect(screen.getByLabelText("owner-ordered 순서 변경"))
      .toBeInTheDocument();
  });

  it("현재 재생 곡은 목록 맨 위에 equalizer로 표시하고 이동 기능에서 제외한다", () => {
    const playingEntry = entry("playing", false);
    playingEntry.status.isActive = true;

    const { container } = render(
      <RoomQueueSortableList
        emptyMessage="비었음"
        entries={[entry("next", false), playingEntry]}
      />,
    );

    const rows = [...container.querySelectorAll("li")];
    expect(rows[0]).toHaveTextContent("playing");
    expect(rows[0]).not.toHaveTextContent("PLAY");
    expect(
      screen.getByRole("img", { name: "현재 재생 중" }),
    ).toBeInTheDocument();
    expect(
      rows[0]?.querySelectorAll('[aria-label="현재 재생 중"] span'),
    ).toHaveLength(3);
    expect(rows[0]?.querySelector("[data-overflowing]"))
      .toHaveTextContent("playing");
    expect(
      screen.queryByLabelText("playing 순서 변경"),
    ).not.toBeInTheDocument();
  });
});
