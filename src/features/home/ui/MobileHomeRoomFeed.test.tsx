import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_HOME_FILTERS } from "@/src/features/room/discovery/ui/HomeControlPanelShell";
import MobileHomeRoomFeed from "./MobileHomeRoomFeed";

describe("MobileHomeRoomFeed 모달 선로딩 intent", () => {
  it("CREATE, FOLLOW, SETTING intent와 기존 클릭 액션을 함께 전달한다", async () => {
    const user = userEvent.setup();
    const onCreateRoom = vi.fn();
    const onMenuItemIntent = vi.fn();
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
        onMenuItemIntent={onMenuItemIntent}
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

    const [createButton, emptyCreateButton] = screen.getAllByRole("button", {
      name: "방 만들기",
    });
    const followButton = screen.getByRole("button", { name: "팔로우" });
    const settingsButton = screen.getByRole("button", { name: "설정" });

    fireEvent.pointerEnter(createButton);
    fireEvent.focus(followButton);
    fireEvent.pointerDown(settingsButton);
    fireEvent.pointerEnter(emptyCreateButton);

    expect(onMenuItemIntent).toHaveBeenNthCalledWith(1, "CREATE");
    expect(onMenuItemIntent).toHaveBeenNthCalledWith(2, "FOLLOW");
    expect(onMenuItemIntent).toHaveBeenNthCalledWith(3, "SETTING");
    expect(onMenuItemIntent).toHaveBeenNthCalledWith(4, "CREATE");

    await user.click(createButton);
    await user.click(followButton);
    await user.click(settingsButton);
    expect(onCreateRoom).toHaveBeenCalledOnce();
    expect(onOpenFollow).toHaveBeenCalledOnce();
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });
});
