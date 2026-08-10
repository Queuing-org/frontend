import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_HOME_FILTERS } from "./HomeControlPanelShell";
import HomeSearchControlDock from "./HomeSearchControlDock";

function renderDock(isNavigationLocked: boolean) {
  const onGoNext = vi.fn();
  const onGoPrevious = vi.fn();
  const onOpenFollow = vi.fn();
  const renderElement = (navigationLocked: boolean) => (
    <HomeSearchControlDock
      activeFilters={DEFAULT_HOME_FILTERS}
      ariaLabel="탐색 컨트롤"
      canGoNext
      canGoPrevious
      genreOptions={[]}
      isNavigationLocked={navigationLocked}
      onCreateRoom={vi.fn()}
      onEnterSelectedRoom={vi.fn()}
      onGoNext={onGoNext}
      onGoPrevious={onGoPrevious}
      onOpenFollow={onOpenFollow}
      onOpenSettings={vi.fn()}
      onRandomEntry={vi.fn()}
      onSelectFilter={vi.fn()}
      selectedRoomSlug="room"
    />
  );
  const result = render(renderElement(isNavigationLocked));

  return {
    ...result,
    onGoNext,
    onGoPrevious,
    onOpenFollow,
    rerenderDock: (navigationLocked: boolean) =>
      result.rerender(renderElement(navigationLocked)),
  };
}

describe("HomeSearchControlDock modal navigation lock", () => {
  it("모달 중에는 좌우와 입장을 보이되 비활성화하고 FILTER를 숨긴다", async () => {
    const user = userEvent.setup();
    const { container, onGoNext, onGoPrevious } = renderDock(true);

    const previousButton = screen.getByRole("button", { name: "이전 방 보기" });
    const nextButton = screen.getByRole("button", { name: "다음 방 보기" });

    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
    await user.click(previousButton);
    await user.click(nextButton);
    expect(onGoPrevious).not.toHaveBeenCalled();
    expect(onGoNext).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "모달 사용 중 방 입장 비활성" }),
    ).toBeDisabled();
    expect(container.firstElementChild).toHaveAttribute(
      "data-modal-active",
      "true",
    );
    expect(
      screen.queryByRole("button", { name: "필터 패널 열기" }),
    ).not.toBeInTheDocument();
  });

  it("탐색 잠금 중에도 MENU에서 다른 모달 액션을 전달한다", async () => {
    const user = userEvent.setup();
    const { onOpenFollow } = renderDock(true);

    await user.click(screen.getByRole("button", { name: "메뉴 패널 열기" }));
    await user.click(screen.getByRole("button", { name: "FOLLOW" }));
    expect(onOpenFollow).toHaveBeenCalledOnce();

    expect(
      screen.queryByRole("button", { name: "필터 패널 열기" }),
    ).not.toBeInTheDocument();
  });

  it("열린 FILTER는 잠금 진입 때 정리되어 잠금 해제 후 다시 나타나지 않는다", async () => {
    const user = userEvent.setup();
    const { rerenderDock } = renderDock(false);

    await user.click(screen.getByRole("button", { name: "필터 패널 열기" }));
    expect(
      screen.getByRole("region", { name: "홈 필터 패널" }),
    ).toBeInTheDocument();

    rerenderDock(true);
    expect(
      screen.queryByRole("region", { name: "홈 필터 패널" }),
    ).not.toBeInTheDocument();

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    rerenderDock(false);
    expect(
      screen.queryByRole("region", { name: "홈 필터 패널" }),
    ).not.toBeInTheDocument();
  });
});
