import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/src/shared/api/api-error";
import { blockUser } from "../api/blockUser";
import BlockUserModal from "./BlockUserModal";

vi.mock("../api/blockUser", () => ({ blockUser: vi.fn() }));

function renderModal(onClose = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <BlockUserModal
        target={{ nickname: "대상", slug: "target-user" }}
        onClose={onClose}
      />
    </QueryClientProvider>,
  );

  return onClose;
}

describe("BlockUserModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("확인 후 같은 모달에서 완료 화면을 보여준다", async () => {
    const user = userEvent.setup();
    const onClose = renderModal();
    vi.mocked(blockUser).mockResolvedValue();

    await user.click(screen.getByRole("button", { name: "차단" }));

    expect(await screen.findByRole("heading", { name: "차단 완료" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("실패하면 확인 화면을 유지하고 오류를 인라인 표시한다", async () => {
    const user = userEvent.setup();
    vi.mocked(blockUser).mockRejectedValue(
      new ApiError({ message: "차단할 수 없습니다.", status: 500 }),
    );
    renderModal();

    await user.click(screen.getByRole("button", { name: "차단" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("차단할 수 없습니다.");
    expect(screen.getByRole("heading", { name: "사용자 차단" })).toBeInTheDocument();
  });

  it("요청 중 중복 제출과 닫기를 막는다", async () => {
    const user = userEvent.setup();
    let resolveBlock: (() => void) | undefined;
    vi.mocked(blockUser).mockImplementation(
      () => new Promise<void>((resolve) => { resolveBlock = resolve; }),
    );
    const onClose = renderModal();

    await user.click(screen.getByRole("button", { name: "차단" }));
    const pendingButton = screen.getByRole("button", { name: "차단 중..." });
    expect(pendingButton).toBeDisabled();
    await user.click(pendingButton);
    await user.click(screen.getByRole("button", { name: "취소" }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(blockUser).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();

    resolveBlock?.();
  });
});
