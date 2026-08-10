import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_HOME_FILTERS } from "./HomeControlPanelShell";
import HomeSearchControlDock from "./HomeSearchControlDock";

function renderDock(isNavigationLocked: boolean) {
  const onOpenFollow = vi.fn();
  const result = render(
    <HomeSearchControlDock
      activeFilters={DEFAULT_HOME_FILTERS}
      ariaLabel="탐색 컨트롤"
      canGoNext
      canGoPrevious
      genreOptions={[]}
      isNavigationLocked={isNavigationLocked}
      onCreateRoom={vi.fn()}
      onEnterSelectedRoom={vi.fn()}
      onGoNext={vi.fn()}
      onGoPrevious={vi.fn()}
      onOpenFollow={onOpenFollow}
      onOpenSettings={vi.fn()}
      onRandomEntry={vi.fn()}
      onSelectFilter={vi.fn()}
      selectedRoomSlug="room"
    />,
  );

  return { ...result, onOpenFollow };
}

describe("HomeSearchControlDock modal navigation lock", () => {
  it("모달 중에는 좌우를 렌더링하지 않고 입장만 비활성화한다", () => {
    const { container } = renderDock(true);

    expect(
      screen.queryByRole("button", { name: "이전 방 보기" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "다음 방 보기" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "모달 사용 중 방 입장 비활성" }),
    ).toBeDisabled();
    expect(container.firstElementChild).toHaveAttribute(
      "data-modal-active",
      "true",
    );
  });

  it("탐색 잠금 중에도 MENU와 FILTER를 열고 다른 모달 액션을 전달한다", async () => {
    const user = userEvent.setup();
    const { onOpenFollow } = renderDock(true);

    await user.click(screen.getByRole("button", { name: "메뉴 패널 열기" }));
    await user.click(screen.getByRole("button", { name: "FOLLOW" }));
    expect(onOpenFollow).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "필터 패널 열기" }));
    expect(screen.getByRole("region", { name: "홈 필터 패널" })).toBeInTheDocument();
  });
});
