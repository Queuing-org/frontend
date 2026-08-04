import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import RoomHistoryList from "./RoomHistoryList";

vi.mock("next/image", () => ({
  default: () => <span data-testid="history-thumbnail" />,
}));

const entry = {
  id: 41,
  title: "밤편지",
  entryId: "entry-1",
  skipped: true,
  videoId: "video",
  provider: "YOUTUBE",
  endedAtMs: Date.parse("2026-07-29T12:00:00Z"),
  durationMs: 185000,
  queuedAtMs: null,
  startedAtMs: null,
  thumbnailUrl: "https://example.com/a.jpg",
  addedByUserSlug: "minji",
};

describe("RoomHistoryList", () => {
  it("지난 곡 정보와 명시적 더 보기 버튼을 표시한다", async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    render(
      <RoomHistoryList
        entries={[entry]}
        emptyMessage="없음"
        hasNextPage
        isFetchingNextPage={false}
        onLoadMore={onLoadMore}
      />,
    );

    expect(screen.getByText("밤편지")).toBeInTheDocument();
    expect(screen.getByText("신청자 minji")).toBeInTheDocument();
    expect(screen.getByText("스킵")).toBeInTheDocument();
    expect(screen.getByText("3:05")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "더 보기" }));
    expect(onLoadMore).toHaveBeenCalledOnce();
  });
});
