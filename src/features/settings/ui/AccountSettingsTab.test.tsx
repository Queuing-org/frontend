import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLogout } from "@/src/features/auth/logout/model/useLogout";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { useWithdrawMe } from "@/src/features/user/profile/hooks/useWithdrawMe";
import AccountSettingsTab from "./AccountSettingsTab";

vi.mock("next/image", () => ({
  default: ({ alt = "" }: { alt?: string }) => (
    <span aria-label={alt || undefined} />
  ),
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
    vi.useFakeTimers();
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it("사유를 하나 이상 선택하고 화면 순서대로 합쳐 제출한다", () => {
    const onLoggedOut = vi.fn();
    render(<AccountSettingsTab onLoggedOut={onLoggedOut} />);

    fireEvent.click(screen.getByRole("button", { name: "회원탈퇴" }));
    const nextButton = screen.getByRole("button", { name: "탈퇴하기" });
    expect(nextButton).toBeEnabled();

    fireEvent.click(screen.getByRole("checkbox", { name: "기타" }));
    fireEvent.click(
      screen.getByRole("checkbox", { name: "자주 사용하지 않아요" }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "기능 오류 및 불편함이 있어요",
      }),
    );
    expect(nextButton).toBeEnabled();
    fireEvent.click(nextButton);

    act(() => vi.advanceTimersByTime(2_000));
    fireEvent.click(screen.getByRole("button", { name: "탈퇴하기" }));

    expect(withdraw).toHaveBeenCalledWith(
      {
        reason: "자주 사용하지 않아요\n기능 오류 및 불편함이 있어요\n기타",
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    const options = withdraw.mock.calls[0]?.[1] as { onSuccess: () => void };
    act(() => options.onSuccess());
    expect(onLoggedOut).toHaveBeenCalledOnce();
  });

  it("최종 탈퇴 버튼은 두 번째 단계 진입 2초 뒤 활성화된다", () => {
    render(<AccountSettingsTab onLoggedOut={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "회원탈퇴" }));
    fireEvent.click(
      screen.getByRole("checkbox", { name: "자주 사용하지 않아요" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "탈퇴하기" }));

    const confirmButton = screen.getByRole("button", { name: "탈퇴하기" });
    expect(confirmButton).toBeDisabled();
    act(() => vi.advanceTimersByTime(1_999));
    expect(confirmButton).toBeDisabled();
    act(() => vi.advanceTimersByTime(1));
    expect(confirmButton).toBeEnabled();
  });

  it("두 번째 단계에서 취소하면 흐름과 선택값, mutation 상태를 초기화한다", () => {
    render(<AccountSettingsTab onLoggedOut={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "회원탈퇴" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "기타" }));
    fireEvent.click(screen.getByRole("button", { name: "탈퇴하기" }));
    fireEvent.click(screen.getByRole("button", { name: "취소" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(resetWithdraw).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "회원탈퇴" }));
    expect(screen.getByRole("checkbox", { name: "기타" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "탈퇴하기" })).toBeEnabled();
  });
});
