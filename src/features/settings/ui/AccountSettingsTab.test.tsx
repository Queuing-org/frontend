import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLogout } from "@/src/features/auth/logout/model/useLogout";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { useWithdrawMe } from "@/src/features/user/profile/hooks/useWithdrawMe";
import AccountSettingsTab from "./AccountSettingsTab";

vi.mock("next/image", () => ({
  default: ({ alt = "" }: { alt?: string }) => <span aria-label={alt || undefined} />,
}));
vi.mock("@/src/features/auth/logout/model/useLogout", () => ({
  useLogout: vi.fn(),
}));
vi.mock("@/src/features/user/session/hooks/useMe", () => ({
  useMe: vi.fn(),
}));
vi.mock("@/src/features/user/profile/hooks/useWithdrawMe", () => ({
  useWithdrawMe: vi.fn(),
}));

const logout = vi.fn();
const withdraw = vi.fn();
const resetWithdraw = vi.fn();

describe("AccountSettingsTab 회원 탈퇴 사유", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMe).mockReturnValue({
      data: { nickname: "나", profileImageUrl: null, slug: "me", userId: 1 },
    } as ReturnType<typeof useMe>);
    vi.mocked(useLogout).mockReturnValue({
      error: null,
      isPending: false,
      mutate: logout,
    } as unknown as ReturnType<typeof useLogout>);
    vi.mocked(useWithdrawMe).mockReturnValue({
      error: null,
      isPending: false,
      mutate: withdraw,
      reset: resetWithdraw,
    } as unknown as ReturnType<typeof useWithdrawMe>);
  });

  it("확인 단계에서 선택 사유와 500자 카운터를 제공하고 제출한다", async () => {
    const user = userEvent.setup();
    const onLoggedOut = vi.fn();
    render(<AccountSettingsTab onLoggedOut={onLoggedOut} />);

    await user.click(screen.getByRole("button", { name: "회원탈퇴" }));
    const reasonInput = screen.getByRole("textbox", {
      name: "탈퇴 사유 (선택)",
    });
    await user.type(reasonInput, "이용 빈도가 낮아요");
    expect(screen.getByText("10/500")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "탈퇴 확인" }));

    expect(withdraw).toHaveBeenCalledWith(
      { reason: "이용 빈도가 낮아요" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    const options = withdraw.mock.calls[0]?.[1] as { onSuccess: () => void };
    act(() => options.onSuccess());
    expect(reasonInput).toHaveValue("");
    expect(onLoggedOut).toHaveBeenCalledOnce();
  });

  it("취소하면 사유와 mutation 오류 상태를 초기화한다", async () => {
    const user = userEvent.setup();
    render(<AccountSettingsTab onLoggedOut={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "회원탈퇴" }));
    const reasonInput = screen.getByRole("textbox", {
      name: "탈퇴 사유 (선택)",
    });
    await user.type(reasonInput, "취소할 사유");
    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(screen.queryByRole("textbox", { name: "탈퇴 사유 (선택)" })).not.toBeInTheDocument();
    expect(resetWithdraw).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "회원탈퇴" }));
    expect(screen.getByRole("textbox", { name: "탈퇴 사유 (선택)" })).toHaveValue("");
  });

  it("500자를 초과한 값은 제출하지 않는다", async () => {
    const user = userEvent.setup();
    render(<AccountSettingsTab onLoggedOut={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "회원탈퇴" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "탈퇴 사유 (선택)" }),
      { target: { value: "가".repeat(501) } },
    );
    await user.click(screen.getByRole("button", { name: "탈퇴 확인" }));

    expect(withdraw).not.toHaveBeenCalled();
  });
});
