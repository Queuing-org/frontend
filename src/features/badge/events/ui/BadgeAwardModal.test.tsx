import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import BadgeAwardModal from "./BadgeAwardModal";

describe("BadgeAwardModal", () => {
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
    expect(screen.getByRole("button", { name: "확인" })).toHaveFocus();
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

    await user.click(screen.getByRole("button", { name: "확인" }));
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.mouseDown(container.firstElementChild!);

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
