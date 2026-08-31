import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import RoomQueuePanelView from "./RoomQueuePanelView";

vi.mock("@/src/features/playlist/add-track/ui/AddTrackAction", () => ({
  default: () => <button type="button">곡 추가</button>,
}));
vi.mock("./RoomQueueListSection", () => ({
  default: () => <div>재생목록 내용</div>,
}));
vi.mock("./RoomQueueTabs", () => ({
  default: () => <div>재생목록 탭</div>,
}));

const baseProps: ComponentProps<typeof RoomQueuePanelView> = {
  activeTab: "all",
  allEntries: [],
  allPendingCount: 0,
  canDeleteEntry: () => false,
  canDeleteEntryAsOwner: () => false,
  currentEntry: null,
  emptyMessage: "비어 있음",
  hasNextHistoryPage: false,
  hasNextAllQueuePage: false,
  hasNextMyQueuePage: false,
  historyEntries: [],
  historyErrorMessage: "",
  includesLatestHistoryPage: true,
  isDeleteMyPending: false,
  isDeleteRoomPending: false,
  isEmptyLoading: false,
  isCurrentUserEntry: () => false,
  isFetchingNextHistoryPage: false,
  isFetchingNextAllQueuePage: false,
  isFetchingNextMyQueuePage: false,
  isHistoryLoading: false,
  isQueueLoading: false,
  isMoveMyPending: false,
  isMoveRoomPending: false,
  isOwner: false,
  isRefetching: false,
  myEntries: [],
  myPendingCount: 0,
  onChangeTab: vi.fn(),
  onDeleteMyEntry: vi.fn(),
  onDeleteRoomEntry: vi.fn(),
  onLoadMoreHistory: vi.fn(),
  onLoadMoreAllQueue: vi.fn(),
  onLoadMoreMyQueue: vi.fn(),
  onMoveMyEntry: vi.fn(),
  onMoveRoomEntry: vi.fn(),
  onResetHistoryToLatest: vi.fn(),
  onRetryHistory: vi.fn(),
  onRetryQueue: vi.fn(),
  queueErrorMessage: "",
  roomAccessToken: "secret",
  roomSlug: "room",
};

function renderView(
  overrides: Partial<ComponentProps<typeof RoomQueuePanelView>> = {},
) {
  return render(<RoomQueuePanelView {...baseProps} {...overrides} />);
}

describe("RoomQueuePanelView", () => {
  it("스크롤 컨테이너를 키보드로 탐색할 수 있게 유지한다", () => {
    renderView();

    expect(screen.getByLabelText("재생목록")).toHaveAttribute("tabindex", "0");
  });

  it("다음 page가 있어도 상시 더 보기 버튼을 렌더링하지 않는다", () => {
    const { rerender } = renderView({
      hasNextAllQueuePage: true,
      hasNextHistoryPage: true,
    });

    expect(screen.queryByText("대기곡 더 보기")).not.toBeInTheDocument();
    expect(screen.queryByText("내 노래 더 보기")).not.toBeInTheDocument();

    rerender(
      <RoomQueuePanelView
        {...baseProps}
        activeTab="mine"
        hasNextMyQueuePage
      />,
    );
    expect(screen.queryByText("내 노래 더 보기")).not.toBeInTheDocument();
  });

  it("위·아래 조회 실패를 각 방향의 재시도 버튼으로 복구한다", () => {
    const onRetryHistory = vi.fn();
    const onRetryQueue = vi.fn();
    renderView({
      historyErrorMessage: "지난 곡 실패",
      onRetryHistory,
      onRetryQueue,
      queueErrorMessage: "대기곡 실패",
    });

    fireEvent.click(
      screen.getByRole("button", { name: "지난 곡 다시 시도" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "대기곡 다시 시도" }),
    );

    expect(onRetryHistory).toHaveBeenCalledOnce();
    expect(onRetryQueue).toHaveBeenCalledOnce();
    expect(screen.getByText("지난 곡 실패")).toBeInTheDocument();
    expect(screen.getByText("대기곡 실패")).toBeInTheDocument();
  });

  it("초기·추가 조회 loading을 기존 목록 영역의 방향별 상태로 표시한다", () => {
    renderView({
      isFetchingNextAllQueuePage: true,
      isHistoryLoading: true,
    });

    expect(screen.getByLabelText("지난 곡 불러오는 중"))
      .toBeInTheDocument();
    expect(screen.getByLabelText("대기곡 불러오는 중"))
      .toBeInTheDocument();
    expect(screen.getByText("재생목록 내용")).toBeInTheDocument();
  });

  it("background refetch 중에는 경계 스크롤의 추가 page 조회를 막는다", () => {
    const onLoadMoreAllQueue = vi.fn();
    renderView({
      hasNextAllQueuePage: true,
      isRefetching: true,
      onLoadMoreAllQueue,
    });
    const container = screen.getByLabelText("재생목록");
    Object.defineProperties(container, {
      clientHeight: { configurable: true, value: 300 },
      scrollHeight: { configurable: true, value: 1_000 },
    });
    container.scrollTop = 200;

    fireEvent.scroll(container);

    expect(onLoadMoreAllQueue).not.toHaveBeenCalled();
  });
});
