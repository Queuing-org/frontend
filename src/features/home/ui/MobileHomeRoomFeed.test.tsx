import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_HOME_FILTERS } from "@/src/features/room/discovery/ui/HomeControlPanelShell";
import MobileHomeRoomFeed from "./MobileHomeRoomFeed";

describe("MobileHomeRoomFeed 빠른 메뉴", () => {
  it("방 만들기, 팔로우, 설정 클릭 액션을 전달한다", async () => {
    const user = userEvent.setup();
    const onCreateRoom = vi.fn();
    const onOpenFollow = vi.fn();
    const onOpenSettings = vi.fn();

    render(
      <MobileHomeRoomFeed
        activeFilters={DEFAULT_HOME_FILTERS}
        genreOptions={[{ label: "ALL", value: "ALL" }]}
        hasNextPage={false}
        isFetchingNextPage={false}
        onCreateRoom={onCreateRoom}
        onLoadMoreRooms={vi.fn()}
        onOpenFollow={onOpenFollow}
        onOpenSettings={onOpenSettings}
        onRandomEntry={vi.fn()}
        onRequestRoomEntry={vi.fn()}
        onSelectFilter={vi.fn()}
        onSelectRoom={vi.fn()}
        rooms={[]}
        selectedRoomSlug={null}
      />,
    );

    const [createButton] = screen.getAllByRole("button", {
      name: "방 만들기",
    });
    const followButton = screen.getByRole("button", { name: "팔로우" });
    const settingsButton = screen.getByRole("button", { name: "설정" });

    await user.click(createButton);
    await user.click(followButton);
    await user.click(settingsButton);
    expect(onCreateRoom).toHaveBeenCalledOnce();
    expect(onOpenFollow).toHaveBeenCalledOnce();
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it("빈 태그 방을 FREE로 표시한다", () => {
    render(
      <MobileHomeRoomFeed
        activeFilters={DEFAULT_HOME_FILTERS}
        genreOptions={[{ label: "ALL", value: "ALL" }]}
        hasNextPage={false}
        isFetchingNextPage={false}
        onCreateRoom={vi.fn()}
        onLoadMoreRooms={vi.fn()}
        onOpenFollow={vi.fn()}
        onOpenSettings={vi.fn()}
        onRandomEntry={vi.fn()}
        onRequestRoomEntry={vi.fn()}
        onSelectFilter={vi.fn()}
        onSelectRoom={vi.fn()}
        rooms={[
          {
            createdAt: "2026-08-11T00:00:00Z",
            id: 1,
            isPrivate: false,
            slug: "free-room",
            tags: [],
            title: "자유로운 방",
          },
        ]}
        selectedRoomSlug={null}
      />,
    );

    expect(screen.getByText("FREE")).toBeVisible();
    expect(screen.queryByText("태그없음")).toBeNull();
  });
});
