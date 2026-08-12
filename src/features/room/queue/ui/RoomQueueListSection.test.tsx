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
  it("전체 순서 동기화가 끝날 때까지 내 신청곡 드래그도 잠근다", () => {
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

  it("내 신청곡 순서 동기화가 끝날 때까지 전체 트랙 드래그도 잠근다", () => {
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
