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

  it("접근 가능한 dialog와 정확히 분리된 두 문장 및 포커스된 적용 버튼을 제공한다", () => {
    render(
      <BadgeAwardModal
        badge={{
          badgeCode: "A",
          description: "누적 방 생성 1회 달성",
          name: "방 팠음",
        }}
        onApply={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "새로운 칭호 획득" }),
    ).toBeInTheDocument();
    expect(screen.getByText("방 팠음")).toBeInTheDocument();
    const achievement = screen.getByText(
      "누적 방 생성 1회 달성하여 새로운 칭호를 획득했습니다!",
    );
    const encouragement = screen.getByText(
      "더 열심히 참여해서 다음 칭호도 획득해보세요.",
    );
    expect(achievement.parentElement).toBe(encouragement.parentElement);
    expect(achievement.parentElement?.children).toHaveLength(2);
    expect(screen.getByRole("button", { name: "적용하기" })).toHaveFocus();
    expect(launchBadgeAwardConfetti).toHaveBeenCalledOnce();
  });

  it("description이 비면 대체 획득 문장과 안내 문장만 표시한다", () => {
    render(
      <BadgeAwardModal
        badge={{ badgeCode: "A", description: "   ", name: "방 팠음" }}
        onApply={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const achievement = screen.getByText("새로운 칭호를 획득했습니다!");
    const encouragement = screen.getByText(
      "더 열심히 참여해서 다음 칭호도 획득해보세요.",
    );
    expect(achievement.parentElement).toBe(encouragement.parentElement);
    expect(achievement.parentElement?.children).toHaveLength(2);
  });

  it("적용하기를 실행하고 확인, Escape, 배경 클릭으로 닫는다", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <BadgeAwardModal
        badge={{ badgeCode: "A", description: null, name: "방 팠음" }}
        onApply={onApply}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole("button", { name: "적용하기" }));
    await user.click(screen.getByRole("button", { name: "확인" }));
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement!);

    expect(onApply).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("Tab 포커스를 두 액션 안에 가두고 닫히면 이전 포커스를 복원한다", async () => {
    const user = userEvent.setup();
    const previousButton = document.createElement("button");
    document.body.append(previousButton);
    previousButton.focus();
    const view = render(
      <BadgeAwardModal
        badge={{ badgeCode: "A", description: null, name: "방 팠음" }}
        onApply={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const applyButton = screen.getByRole("button", { name: "적용하기" });
    const confirmButton = screen.getByRole("button", { name: "확인" });
    expect(applyButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(confirmButton).toHaveFocus();
    await user.tab();
    expect(applyButton).toHaveFocus();

    view.rerender(
      <BadgeAwardModal
        badge={null}
        onApply={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(previousButton).toHaveFocus();
    previousButton.remove();
  });

  it("적용 중에는 닫기 액션을 잠그고 실패 문구를 알린다", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const view = render(
      <BadgeAwardModal
        applyErrorMessage="대표 칭호를 설정하지 못했습니다."
        badge={{ badgeCode: "A", description: null, name: "방 팠음" }}
        isApplying
        onApply={vi.fn()}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "대표 칭호를 설정하지 못했습니다.",
    );
    expect(screen.getByRole("button", { name: "대표 칭호 적용 중" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "확인" })).toBeDisabled();
    expect(screen.getByRole("dialog")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("dialog")).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "확인" }));
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement!);
    expect(onClose).not.toHaveBeenCalled();

    view.rerender(
      <BadgeAwardModal
        applyErrorMessage="대표 칭호를 설정하지 못했습니다."
        badge={{ badgeCode: "A", description: null, name: "방 팠음" }}
        onApply={vi.fn()}
        onClose={onClose}
      />,
    );
    expect(screen.getByRole("button", { name: "적용하기" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "확인" })).toHaveFocus();
    expect(onClose).not.toHaveBeenCalled();
  });
});
