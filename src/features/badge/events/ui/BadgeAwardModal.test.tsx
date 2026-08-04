import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BadgeAwardModal from "./BadgeAwardModal";
import { launchBadgeAwardConfetti } from "./badgeAwardConfetti";

vi.mock("./badgeAwardConfetti", () => ({
  launchBadgeAwardConfetti: vi.fn().mockResolvedValue(undefined),
}));

describe("BadgeAwardModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("접근 가능한 dialog와 포커스된 확인 버튼을 제공한다", () => {
    render(
      <BadgeAwardModal
        badge={{ badgeCode: "A", name: "방 팠음" }}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "방 팠음 칭호 획득하셨습니다!" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "멋진데요!" })).toHaveFocus();
    expect(launchBadgeAwardConfetti).toHaveBeenCalledOnce();
  });

  it("확인, Escape, 배경 클릭으로 닫는다", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <BadgeAwardModal
        badge={{ badgeCode: "A", name: "방 팠음" }}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole("button", { name: "멋진데요!" }));
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.mouseDown(container.firstElementChild!);

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
