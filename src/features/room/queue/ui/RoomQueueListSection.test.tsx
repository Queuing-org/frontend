import { fireEvent, render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import type {
  PlaylistEntry,
  RoomQueuePlaybackOrigin,
  RoomQueueHistoryEntry,
} from "@/src/features/playlist/model/types";
import RoomQueueListSection from "./RoomQueueListSection";

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

const entry = (
  entryId: string,
  isActive = false,
  playbackOrigin?: RoomQueuePlaybackOrigin,
): PlaylistEntry => ({
  addedBy: { avatarUrl: null, nickname: "나", slug: "me" },
  createdAtMs: 1,
  entryId,
  order: 1,
  status: {
    isActive,
    isPlayed: false,
    ownerOrdered: false,
    playbackOrigin,
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

const historyEntry = (id: number): RoomQueueHistoryEntry => ({
  addedByUserSlug: "requester-slug",
  durationMs: 180_000,
  endedAtMs: 999,
  entryId: `history-entry-${id}`,
  id,
  provider: "YOUTUBE",
  queuedAtMs: 1,
  skipped: true,
  playbackOrigin: "AUTOMATIC_REPLAY",
  startOffsetMs: 0,
  startedAtMs: 2,
  thumbnailUrl: null,
  title: `지난 곡 ${id}`,
  videoId: `history-video-${id}`,
});

const baseProps = {
  allEntries: [entry("all-a"), entry("all-b")],
  canDeleteEntry: () => true,
  canDeleteEntryAsOwner: () => true,
  emptyMessage: "비었음",
  hasNextAllQueuePage: false,
  hasNextMyQueuePage: false,
  historyEntries: [],
  includesLatestHistoryPage: true,
  isDeleteMyPending: false,
  isDeleteRoomPending: false,
  isEmptyLoading: false,
  isAutomaticReplayActive: false,
  isCurrentUserEntry: (queueEntry: PlaylistEntry) =>
    queueEntry.addedBy.slug === "me",
  isMoveMyPending: false,
  isMoveRoomPending: false,
  isOwner: true,
  myEntries: [entry("mine-a"), entry("mine-b")],
  onDeleteMyEntry: vi.fn(),
  onDeleteRoomEntry: vi.fn(),
  onReturnToCurrent: vi.fn(),
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
        allEntries={[]}
        currentEntry={entry("now-playing", true)}
      />,
    );

    const activeEntry = screen
      .getByRole("img", { name: "현재 재생 중" })
      .closest("li");
    expect(activeEntry).not.toBeNull();
    expect(activeEntry).toHaveAttribute("data-current-user", "true");
    expect(activeEntry).toHaveAttribute("data-active", "true");
  });

  it("자동 순환 재생만 있으면 현재곡 카드 대신 움직이는 상태를 표시한다", () => {
    render(
      <RoomQueueListSection
        {...baseProps}
        activeTab="all"
        allEntries={[]}
        currentEntry={entry(
          "automatic-track",
          true,
          "AUTOMATIC_REPLAY",
        )}
        isAutomaticReplayActive
        myEntries={[]}
      />,
    );

    const state = screen.getByRole("status");
    expect(state).toHaveTextContent("현재 자동 재생 중입니다");
    expect(state).toHaveAttribute("data-fill-available-space", "true");
    expect(state.querySelectorAll("[data-bar]")).toHaveLength(3);
    expect(screen.queryByText("automatic-track")).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "현재 재생 중" }))
      .not.toBeInTheDocument();
  });

  it("자동 순환 중에도 지난 곡과 대기곡은 유지하고 현재곡만 대체한다", () => {
    render(
      <RoomQueueListSection
        {...baseProps}
        activeTab="all"
        currentEntry={entry(
          "automatic-track",
          true,
          "AUTOMATIC_REPLAY",
        )}
        historyEntries={[historyEntry(1)]}
        isAutomaticReplayActive
      />,
    );

    expect(screen.getByText("지난 곡 1")).toBeInTheDocument();
    expect(screen.getByLabelText("all-a 순서 변경")).toBeInTheDocument();
    expect(
      screen
        .getByText("현재 자동 재생 중입니다")
        .closest('[role="status"]'),
    ).toHaveAttribute(
      "data-fill-available-space",
      "false",
    );
    expect(screen.queryByText("automatic-track")).not.toBeInTheDocument();
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

  it("지난 곡은 썸네일·제목·길이만 표시하고 DnD에서 제외한다", () => {
    render(
      <RoomQueueListSection
        {...baseProps}
        activeTab="all"
        allEntries={[]}
        historyEntries={[historyEntry(1)]}
      />,
    );

    expect(screen.getByText("지난 곡 1")).toBeInTheDocument();
    expect(screen.getByText("3:00")).toBeInTheDocument();
    expect(screen.queryByText("requester-slug")).not.toBeInTheDocument();
    expect(screen.queryByText("자동재생")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("지난 곡 1 순서 변경"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("지난 곡 1").closest("li")).toHaveAttribute(
      "data-history",
      "true",
    );
  });

  it("내 노래 탭도 지난 곡과 본인 현재곡을 대기곡 앞에 표시한다", () => {
    render(
      <RoomQueueListSection
        {...baseProps}
        activeTab="mine"
        currentEntry={entry("now-playing", true)}
        historyEntries={[historyEntry(1)]}
      />,
    );

    expect(screen.getByText("지난 곡 1")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "현재 재생 중" }))
      .toBeInTheDocument();
    expect(screen.getByLabelText("mine-a 순서 변경"))
      .toBeInTheDocument();
  });

  it("전체 대기곡이 없어도 내 대기곡 목록은 빈 상태로 가리지 않는다", () => {
    render(
      <RoomQueueListSection
        {...baseProps}
        activeTab="mine"
        allEntries={[]}
      />,
    );

    expect(screen.getByLabelText("mine-a 순서 변경"))
      .toBeInTheDocument();
    expect(screen.queryByText("비었음")).not.toBeInTheDocument();
  });

  it("최신 history가 밀려난 경계에서 현재 곡 복귀 동작을 제공한다", () => {
    const onReturnToCurrent = vi.fn();
    render(
      <RoomQueueListSection
        {...baseProps}
        activeTab="all"
        allEntries={[]}
        historyEntries={[historyEntry(1)]}
        includesLatestHistoryPage={false}
        onReturnToCurrent={onReturnToCurrent}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "현재 곡으로 돌아가기" }),
    );
    expect(onReturnToCurrent).toHaveBeenCalledOnce();
    expect(
      screen.getByText("최신 재생 기록과 떨어진 구간입니다."),
    ).toBeInTheDocument();
  });
});
