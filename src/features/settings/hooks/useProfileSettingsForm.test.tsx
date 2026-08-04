import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { useUpdateMe } from "@/src/features/user/profile/hooks/useUpdateMe";
import {
  STATUS_MESSAGE_MAX_LENGTH,
  useProfileSettingsForm,
} from "./useProfileSettingsForm";

vi.mock("@/src/features/user/session/hooks/useMe", () => ({
  useMe: vi.fn(),
}));
vi.mock("@/src/features/user/profile/hooks/useUpdateMe", () => ({
  useUpdateMe: vi.fn(),
}));

const mutate = vi.fn();
const reset = vi.fn();

describe("프로필 상태 메시지 폼", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMe).mockReturnValue({
      data: {
        nickname: "민지",
        slug: "minji",
        profileImageUrl: null,
        statusMessage: "기존 메시지",
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useMe>);
    vi.mocked(useUpdateMe).mockReturnValue({
      mutate,
      isPending: false,
      error: null,
      reset,
    } as unknown as ReturnType<typeof useUpdateMe>);
  });

  it("빈 문자열은 삭제 의도로 payload에 포함한다", () => {
    const { result } = renderHook(() => useProfileSettingsForm());

    act(() => result.current.updateStatusMessageDraft(""));
    act(() =>
      result.current.handleProfileSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>),
    );

    expect(mutate).toHaveBeenCalledWith(
      { statusMessage: "" },
      expect.any(Object),
    );
  });

  it("상태 메시지를 건드리지 않으면 null이나 statusMessage를 보내지 않는다", () => {
    const { result } = renderHook(() => useProfileSettingsForm());

    act(() => result.current.updateNicknameDraft("새 닉네임"));
    act(() =>
      result.current.handleProfileSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>),
    );

    expect(mutate).toHaveBeenCalledWith(
      { nickname: "새 닉네임" },
      expect.any(Object),
    );
  });

  it("줄바꿈을 제거하고 255자로 제한한다", () => {
    const { result } = renderHook(() => useProfileSettingsForm());

    act(() =>
      result.current.updateStatusMessageDraft(
        `${"a".repeat(STATUS_MESSAGE_MAX_LENGTH)}\n추가`,
      ),
    );

    expect(result.current.statusMessage).toHaveLength(
      STATUS_MESSAGE_MAX_LENGTH,
    );
    expect(result.current.statusMessage).not.toContain("\n");
  });
});
