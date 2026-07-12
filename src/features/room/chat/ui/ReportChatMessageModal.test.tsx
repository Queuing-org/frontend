import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/src/shared/api/api-error";
import { reportChatMessage } from "../api/reportChatMessage";
import ReportChatMessageModal from "./ReportChatMessageModal";

vi.mock("../api/reportChatMessage", () => ({ reportChatMessage: vi.fn() }));

function renderModal(onClose = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ReportChatMessageModal
        target={{
          messageKey: "message-key",
          password: "secret",
          slug: "room-slug",
        }}
        onClose={onClose}
      />
    </QueryClientProvider>,
  );
  return onClose;
}

describe("ReportChatMessageModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("사유 미선택 상태에서는 신고 버튼을 비활성화한다", () => {
    renderModal();

    expect(screen.getByRole("button", { name: "신고" })).toBeDisabled();
  });

  it("선택 순서와 무관하게 화면 순서대로 줄바꿈한 payload를 보내고 성공 시 닫는다", async () => {
    const user = userEvent.setup();
    vi.mocked(reportChatMessage).mockResolvedValue();
    const onClose = renderModal();

    await user.click(screen.getByRole("checkbox", { name: "기타 부적절한 내용" }));
    await user.click(screen.getByRole("checkbox", { name: "욕설 및 비방" }));
    await user.click(screen.getByRole("button", { name: "신고" }));

    expect(vi.mocked(reportChatMessage).mock.calls[0]?.[0]).toEqual({
      messageKey: "message-key",
      password: "secret",
      reason: "욕설 및 비방\n기타 부적절한 내용",
      slug: "room-slug",
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("실패 시 선택 상태를 유지하고 오류를 인라인 표시한다", async () => {
    const user = userEvent.setup();
    vi.mocked(reportChatMessage).mockRejectedValue(
      new ApiError({ message: "신고하지 못했습니다.", status: 500 }),
    );
    renderModal();

    const reason = screen.getByRole("checkbox", { name: "스팸 및 도배" });
    await user.click(reason);
    await user.click(screen.getByRole("button", { name: "신고" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("신고하지 못했습니다.");
    expect(reason).toBeChecked();
  });

  it("요청 중 중복 제출과 닫기를 막는다", async () => {
    const user = userEvent.setup();
    vi.mocked(reportChatMessage).mockImplementation(() => new Promise(() => {}));
    const onClose = renderModal();

    await user.click(screen.getByRole("checkbox", { name: "욕설 및 비방" }));
    await user.click(screen.getByRole("button", { name: "신고" }));
    const pendingButton = screen.getByRole("button", { name: "신고 중..." });
    expect(pendingButton).toBeDisabled();
    await user.click(pendingButton);
    await user.click(screen.getByRole("button", { name: "취소" }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(reportChatMessage).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });
});
