import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { useUpdateMe } from "@/src/features/user/profile/hooks/useUpdateMe";
import {
  PROFILE_FIELD_FEEDBACK_DURATION_MS,
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

function submit(result: ReturnType<typeof renderProfileForm>["result"]) {
  act(() =>
    result.current.handleProfileSubmit({
      preventDefault: vi.fn(),
    } as unknown as React.FormEvent<HTMLFormElement>),
  );
}

function renderProfileForm() {
  return renderHook(() => useProfileSettingsForm());
}

function getMutationOptions() {
  return mutate.mock.lastCall?.[1] as {
    onError: () => void;
    onSuccess: () => void;
  };
}

describe("프로필 통합 저장 폼", () => {
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it("닉네임만 변경하면 nickname만 한 요청으로 보낸다", () => {
    const { result } = renderProfileForm();

    act(() => result.current.updateNicknameDraft(" 새 닉네임 "));
    submit(result);

    expect(mutate).toHaveBeenCalledOnce();
    expect(mutate).toHaveBeenCalledWith(
      { nickname: "새 닉네임" },
      expect.any(Object),
    );
  });

  it("메시지만 변경하면 nickname을 제외하고 빈 statusMessage만 보낸다", () => {
    const { result } = renderProfileForm();

    act(() => result.current.updateStatusMessageDraft(""));
    submit(result);

    expect(mutate).toHaveBeenCalledWith(
      { statusMessage: "" },
      expect.any(Object),
    );
  });

  it("닉네임과 메시지를 함께 변경하면 두 값을 단일 요청으로 보낸다", () => {
    const { result } = renderProfileForm();

    act(() => result.current.updateNicknameDraft("새 닉네임"));
    act(() => result.current.updateStatusMessageDraft("새 메시지"));
    submit(result);

    expect(mutate).toHaveBeenCalledOnce();
    expect(mutate).toHaveBeenCalledWith(
      { nickname: "새 닉네임", statusMessage: "새 메시지" },
      expect.any(Object),
    );
  });

  it("변경이 있고 변경된 닉네임이 유효할 때만 통합 저장을 활성화한다", () => {
    const { result } = renderProfileForm();

    expect(result.current.canUpdateProfile).toBe(false);

    act(() => result.current.updateStatusMessageDraft("새 메시지"));
    expect(result.current.canUpdateProfile).toBe(true);

    act(() => result.current.updateNicknameDraft("한"));
    expect(result.current.canUpdateProfile).toBe(false);

    act(() => result.current.updateNicknameDraft("한글"));
    expect(result.current.canUpdateProfile).toBe(true);
  });

  it("줄바꿈을 제거하고 255자로 제한한다", () => {
    const { result } = renderProfileForm();

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

  it("성공한 요청에 포함된 필드만 정확히 2초간 초록 상태로 표시한다", () => {
    vi.useFakeTimers();
    const { result } = renderProfileForm();

    act(() => result.current.updateStatusMessageDraft("새 메시지"));
    submit(result);
    act(() => getMutationOptions().onSuccess());

    expect(result.current.nicknameFeedback).toBeNull();
    expect(result.current.statusMessageFeedback).toBe("success");

    act(() => vi.advanceTimersByTime(PROFILE_FIELD_FEEDBACK_DURATION_MS - 1));
    expect(result.current.statusMessageFeedback).toBe("success");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.statusMessageFeedback).toBeNull();
  });

  it("함께 저장한 요청이 실패하면 두 필드를 2초간 빨갛게 표시한다", () => {
    vi.useFakeTimers();
    const { result } = renderProfileForm();

    act(() => result.current.updateNicknameDraft("새 닉네임"));
    act(() => result.current.updateStatusMessageDraft("새 메시지"));
    submit(result);
    act(() => getMutationOptions().onError());

    expect(result.current.nicknameFeedback).toBe("error");
    expect(result.current.statusMessageFeedback).toBe("error");

    act(() => vi.advanceTimersByTime(PROFILE_FIELD_FEEDBACK_DURATION_MS));
    expect(result.current.nicknameFeedback).toBeNull();
    expect(result.current.statusMessageFeedback).toBeNull();
  });

  it("재입력과 재요청은 이전 필드 피드백 타이머를 정리한다", () => {
    vi.useFakeTimers();
    const { result } = renderProfileForm();

    act(() => result.current.updateNicknameDraft("새 닉네임"));
    submit(result);
    act(() => getMutationOptions().onError());
    expect(result.current.nicknameFeedback).toBe("error");

    submit(result);
    expect(result.current.nicknameFeedback).toBeNull();
    expect(vi.getTimerCount()).toBe(0);

    act(() => getMutationOptions().onError());
    expect(result.current.nicknameFeedback).toBe("error");
    act(() => result.current.updateNicknameDraft("다른 닉네임"));
    expect(result.current.nicknameFeedback).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("언마운트 시 진행 중인 필드 피드백 타이머를 정리한다", () => {
    vi.useFakeTimers();
    const { result, unmount } = renderProfileForm();

    act(() => result.current.updateNicknameDraft("새 닉네임"));
    submit(result);
    act(() => getMutationOptions().onSuccess());
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
