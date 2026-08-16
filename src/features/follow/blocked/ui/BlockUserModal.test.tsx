import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/src/shared/api/api-error";
import { blockUser } from "../api/blockUser";
import BlockUserModal from "./BlockUserModal";

vi.mock("../api/blockUser", () => ({ blockUser: vi.fn() }));

function renderModal({
  onBlocked = vi.fn(),
  onClose = vi.fn(),
}: {
  onBlocked?: ReturnType<typeof vi.fn>;
  onClose?: ReturnType<typeof vi.fn>;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  const view = render(
    <QueryClientProvider client={queryClient}>
      <BlockUserModal
        target={{ nickname: "대상", slug: "target-user" }}
        onBlocked={onBlocked}
        onClose={onClose}
      />
    </QueryClientProvider>,
  );

  return { ...view, onBlocked, onClose, queryClient };
}

describe("BlockUserModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("확인 후 같은 모달에서 완료 화면을 보여준다", async () => {
    const user = userEvent.setup();
    const { onBlocked, onClose } = renderModal();
    vi.mocked(blockUser).mockResolvedValue();

    await user.type(
      screen.getByRole("textbox", { name: "차단 사유 (선택)" }),
      "반복 메시지",
    );
    expect(screen.getByText("6/500")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "차단" }));

    expect(blockUser).toHaveBeenCalledWith(
      {
        reason: "반복 메시지",
        targetSlug: "target-user",
      },
      expect.anything(),
    );

    expect(await screen.findByRole("heading", { name: "차단 완료" })).toBeInTheDocument();
    expect(onBlocked).toHaveBeenCalledWith({
      nickname: "대상",
      slug: "target-user",
    });
    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("취소하면 입력한 사유를 초기화한다", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    const reasonInput = screen.getByRole("textbox", {
      name: "차단 사유 (선택)",
    });

    await user.type(reasonInput, "취소할 사유");
    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(reasonInput).toHaveValue("");
  });

  it("대상이 바뀌면 이전 대상의 사유를 다시 복원하지 않는다", async () => {
    const user = userEvent.setup();
    const { onBlocked, onClose, queryClient, rerender } = renderModal();
    const renderTarget = (nickname: string, slug: string) => (
      <QueryClientProvider client={queryClient}>
        <BlockUserModal
          target={{ nickname, slug }}
          onBlocked={onBlocked}
          onClose={onClose}
        />
      </QueryClientProvider>
    );

    await user.type(
      screen.getByRole("textbox", { name: "차단 사유 (선택)" }),
      "A 대상 사유",
    );

    rerender(renderTarget("B 대상", "target-b"));
    expect(
      screen.getByRole("textbox", { name: "차단 사유 (선택)" }),
    ).toHaveValue("");

    await user.type(
      screen.getByRole("textbox", { name: "차단 사유 (선택)" }),
      "B 대상 사유",
    );
    rerender(renderTarget("A 대상", "target-user"));

    expect(
      screen.getByRole("textbox", { name: "차단 사유 (선택)" }),
    ).toHaveValue("");
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
    expect(screen.getByRole("button", { name: "차단" })).toHaveFocus();
  });

  it("요청 중 중복 제출과 닫기를 막는다", async () => {
    const user = userEvent.setup();
    let resolveBlock: (() => void) | undefined;
    vi.mocked(blockUser).mockImplementation(
      () => new Promise<void>((resolve) => { resolveBlock = resolve; }),
    );
    const { onClose } = renderModal();

    await user.click(screen.getByRole("button", { name: "차단" }));
    const pendingButton = screen.getByRole("button", { name: "차단 중" });
    expect(pendingButton).toBeDisabled();
    await user.click(pendingButton);
    await user.click(screen.getByRole("button", { name: "취소" }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(blockUser).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => {
      resolveBlock?.();
    });
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "차단 완료" })).toBeInTheDocument();
    });
  });
});
