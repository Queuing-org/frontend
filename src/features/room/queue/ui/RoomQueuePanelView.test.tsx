import { render, screen } from "@testing-library/react";
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

describe("RoomQueuePanelView", () => {
  it("스크롤 컨테이너를 키보드로 탐색할 수 있게 유지한다", () => {
    render(
      <RoomQueuePanelView
        activeTab="all"
        allEntries={[]}
        allPendingCount={0}
        canDeleteEntry={() => false}
        canDeleteEntryAsOwner={() => false}
        deleteErrorMessage=""
        emptyMessage="비어 있음"
        hasNextAllQueuePage={false}
        hasNextMyQueuePage={false}
        isDeleteMyPending={false}
        isDeleteRoomPending={false}
        isEmptyLoading={false}
        isCurrentUserEntry={() => false}
        isFetchingNextAllQueuePage={false}
        isFetchingNextMyQueuePage={false}
        isMoveMyPending={false}
        isMoveRoomPending={false}
        isOwner={false}
        isRefetching={false}
        moveErrorMessage=""
        myEntries={[]}
        myPendingCount={0}
        onChangeTab={vi.fn()}
        onDeleteMyEntry={vi.fn()}
        onDeleteRoomEntry={vi.fn()}
        onLoadMoreAllQueue={vi.fn()}
        onLoadMoreMyQueue={vi.fn()}
        onMoveMyEntry={vi.fn()}
        onMoveRoomEntry={vi.fn()}
        queueErrorMessage=""
        roomSlug="room"
      />,
    );

    expect(screen.getByLabelText("재생목록")).toHaveAttribute("tabindex", "0");
  });
});
