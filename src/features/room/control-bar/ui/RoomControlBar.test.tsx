import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import RoomControlBar from "./RoomControlBar";

function renderControlBar(onResetWidgetPositions = vi.fn()) {
  render(
    <RoomControlBar
      isChatOpen={false}
      isParticipantsOpen={false}
      isProfileOpen={false}
      isQueueOpen={false}
      onResetWidgetPositions={onResetWidgetPositions}
      onToggleChat={vi.fn()}
      onToggleParticipants={vi.fn()}
      onToggleProfile={vi.fn()}
      onToggleQueue={vi.fn()}
    />,
  );

  return { onResetWidgetPositions };
}

describe("RoomControlBar", () => {
  it("초기화 버튼을 누르면 floating 위젯 위치 초기화를 요청한다", async () => {
    const user = userEvent.setup();
    const { onResetWidgetPositions } = renderControlBar();

    await user.click(screen.getByRole("button", { name: "모달 위치 초기화" }));

    expect(onResetWidgetPositions).toHaveBeenCalledTimes(1);
  });
});
