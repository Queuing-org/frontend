import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import RoomJoinConflictDialog from "./RoomJoinConflictDialog";

const conflict = {
  currentRoom: { slug: "current-room", title: "현재 방" },
  target: { password: "secret", slug: "next-room" },
};

describe("RoomJoinConflictDialog", () => {
  it("제목과 설명을 연결하고 돌아가기에 최초 포커스를 둔다", () => {
    render(
      <RoomJoinConflictDialog
        conflict={conflict}
        isPending={false}
        onConfirm={vi.fn()}
        onReturn={vi.fn()}
      />,
    );

    const dialog = screen.getByRole("dialog", {
      name: "이미 참여중인 방이 있습니다",
    });
    expect(dialog).toHaveAccessibleDescription(
      "현재 ‘현재 방’ 방에 참여 중입니다. 기존 방에서 나가고 새 방에 참여하시겠습니까?",
    );
    expect(screen.getByRole("button", { name: "돌아가기" })).toHaveFocus();
  });

  it("돌아가기, 배경 클릭, Escape를 같은 복귀 동작으로 연결한다", async () => {
    const user = userEvent.setup();
    const onReturn = vi.fn();
    const { rerender } = render(
      <RoomJoinConflictDialog
        conflict={conflict}
        isPending={false}
        onConfirm={vi.fn()}
        onReturn={onReturn}
      />,
    );

    await user.click(screen.getByRole("button", { name: "돌아가기" }));
    const overlay = screen.getByRole("dialog").parentElement;
    expect(overlay).not.toBeNull();
    fireEvent.mouseDown(overlay!);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onReturn).toHaveBeenCalledTimes(3);

    rerender(
      <RoomJoinConflictDialog
        conflict={conflict}
        isPending
        onConfirm={vi.fn()}
        onReturn={onReturn}
      />,
    );
    expect(screen.getByRole("button", { name: "돌아가기" })).toBeDisabled();
    expect(screen.getByRole("status", { name: "새 방 참여 처리 중" }))
      .toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onReturn).toHaveBeenCalledTimes(3);
  });
});
