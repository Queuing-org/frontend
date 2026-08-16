import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RoomLeaveConfirmDialog from "./RoomLeaveConfirmDialog";

const mocks = vi.hoisted(() => ({
  notify: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock("@/src/shared/ui/action-feedback/ActionFeedbackProvider", () => ({
  useActionFeedback: () => ({ notify: mocks.notify }),
}));

describe("RoomLeaveConfirmDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("publish 실패 시 확인 모달을 유지하고 오류만 알린다", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(
      <RoomLeaveConfirmDialog
        onCancel={vi.fn()}
        onLeaveRoom={() => false}
        onSuccess={onSuccess}
        open
        roomSlug="room"
        roomTitle="테스트 방"
      />,
    );

    await user.click(screen.getByRole("button", { name: "나가기" }));

    expect(screen.getByRole("dialog", { name: "테스트 방" })).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.notify).toHaveBeenCalledWith({
      dedupeKey: "room-leave:room",
      message: "방에서 나가지 못했습니다.",
      tone: "error",
    });
  });

  it("publish 성공 시 모달 상태를 닫고 성공 알림 후 홈으로 이동한다", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(
      <RoomLeaveConfirmDialog
        onCancel={vi.fn()}
        onLeaveRoom={() => true}
        onSuccess={onSuccess}
        open
        roomSlug="room"
        roomTitle="테스트 방"
      />,
    );

    await user.click(screen.getByRole("button", { name: "나가기" }));

    expect(onSuccess).toHaveBeenCalledOnce();
    expect(mocks.notify).toHaveBeenCalledWith({
      dedupeKey: "room-leave:room",
      message: "'테스트 방' 방에서 나갔습니다.",
      tone: "default",
    });
    expect(mocks.replace).toHaveBeenCalledWith("/");
  });
});
