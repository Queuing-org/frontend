import { render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import type { PlaylistEntry } from "@/src/features/playlist/model/types";
import RoomQueueListSection from "./RoomQueueListSection";

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

const entry = (entryId: string, isActive = false): PlaylistEntry => ({
  addedBy: { avatarUrl: null, nickname: "나", slug: "me" },
  createdAtMs: 1,
  entryId,
  order: 1,
  status: {
    isActive,
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

const baseProps = {
  allEntries: [entry("all-a"), entry("all-b")],
  canDeleteEntry: () => true,
  canDeleteEntryAsOwner: () => true,
  emptyMessage: "비었음",
  hasNextAllQueuePage: false,
  hasNextMyQueuePage: false,
  isDeleteMyPending: false,
  isDeleteRoomPending: false,
  isEmptyLoading: false,
  isCurrentUserEntry: (queueEntry: PlaylistEntry) =>
    queueEntry.addedBy.slug === "me",
  isMoveMyPending: false,
  isMoveRoomPending: false,
  isOwner: true,
  myEntries: [entry("mine-a"), entry("mine-b")],
  onDeleteMyEntry: vi.fn(),
  onDeleteRoomEntry: vi.fn(),
  onMoveMyEntry: vi.fn(),
  onMoveRoomEntry: vi.fn(),
};

describe("RoomQueueListSection move lock", () => {
  it("전체 순서 동기화가 끝날 때까지 내 노래 드래그도 잠근다", () => {
    render(
      <RoomQueueListSection
        {...baseProps}
        activeTab="mine"
        isMoveRoomPending
      />,
    );

    expect(screen.getByLabelText("mine-a 순서 변경")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("전체 트랙의 내 노래만 강조하고 내 노래 탭에서는 강조하지 않는다", () => {
    const { rerender } = render(
      <RoomQueueListSection {...baseProps} activeTab="all" />,
    );

    expect(screen.getByLabelText("all-a 순서 변경")).toHaveAttribute(
      "data-current-user",
      "true",
    );

    rerender(<RoomQueueListSection {...baseProps} activeTab="mine" />);

    expect(screen.getByLabelText("mine-a 순서 변경")).not.toHaveAttribute(
      "data-current-user",
    );
  });

  it("현재 재생 중인 내 노래에 사용자 강조와 active 상태를 함께 전달한다", () => {
    render(
      <RoomQueueListSection
        {...baseProps}
        activeTab="all"
        allEntries={[entry("now-playing", true)]}
      />,
    );

    const activeEntry = screen
      .getByRole("img", { name: "현재 재생 중" })
      .closest("li");
    expect(activeEntry).not.toBeNull();
    expect(activeEntry).toHaveAttribute("data-current-user", "true");
    expect(activeEntry).toHaveAttribute("data-active", "true");
  });

  it("내 노래 순서 동기화가 끝날 때까지 전체 트랙 드래그도 잠근다", () => {
    render(
      <RoomQueueListSection
        {...baseProps}
        activeTab="all"
        isMoveMyPending
      />,
    );

    expect(screen.getByLabelText("all-a 순서 변경")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
