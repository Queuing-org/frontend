import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { useUpdateMe } from "@/src/features/user/profile/hooks/useUpdateMe";
import { STATUS_MESSAGE_MAX_LENGTH, useProfileSettingsForm } from "./useProfileSettingsForm";

const { notify } = vi.hoisted(() => ({ notify: vi.fn() }));

vi.mock("@/src/features/user/session/hooks/useMe", () => ({
  useMe: vi.fn(),
}));
vi.mock("@/src/features/user/profile/hooks/useUpdateMe", () => ({
  useUpdateMe: vi.fn(),
}));
vi.mock("@/src/shared/ui/action-feedback/ActionFeedbackProvider", () => ({
  useActionFeedback: () => ({ notify }),
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

  it("변경이 있으면 저장을 활성화하고 닉네임 검증은 제출 시 수행한다", () => {
    const { result } = renderProfileForm();

    expect(result.current.canUpdateProfile).toBe(false);
    expect(result.current.hasProfileChanges).toBe(false);

    act(() => result.current.updateStatusMessageDraft("새 메시지"));
    expect(result.current.canUpdateProfile).toBe(true);
    expect(result.current.hasProfileChanges).toBe(true);

    act(() => result.current.updateNicknameDraft("한"));
    expect(result.current.canUpdateProfile).toBe(true);
    expect(result.current.hasProfileChanges).toBe(true);

    submit(result);
    expect(mutate).not.toHaveBeenCalled();
    expect(result.current.nicknameFeedback).toBe("error");
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ tone: "error" }));

    act(() => result.current.updateNicknameDraft("한글"));
    expect(result.current.canUpdateProfile).toBe(true);
  });

  it("저장 성공 후 변경 상태를 초기화해 완료 버튼을 숨길 수 있게 한다", () => {
    const { result } = renderProfileForm();

    act(() => result.current.updateStatusMessageDraft("새 메시지"));
    submit(result);
    act(() => getMutationOptions().onSuccess());

    expect(result.current.hasProfileChanges).toBe(false);
    expect(result.current.canUpdateProfile).toBe(false);
  });

  it("줄바꿈을 제거하고 20자로 제한한다", () => {
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

  it("저장 성공은 필드 상태 대신 공통 알림으로 표시한다", () => {
    const { result } = renderProfileForm();

    act(() => result.current.updateStatusMessageDraft("새 메시지"));
    submit(result);
    act(() => getMutationOptions().onSuccess());

    expect(result.current.nicknameFeedback).toBeNull();
    expect(result.current.statusMessageFeedback).toBeNull();
    expect(notify).toHaveBeenCalledWith({
      dedupeKey: "profile:update",
      message: "최애곡을 변경했습니다.",
      tone: "default",
    });
  });

  it("함께 저장한 요청이 실패하면 두 필드를 빨갛게 유지하고 오류 알림을 표시한다", () => {
    const { result } = renderProfileForm();

    act(() => result.current.updateNicknameDraft("새 닉네임"));
    act(() => result.current.updateStatusMessageDraft("새 메시지"));
    submit(result);
    act(() => getMutationOptions().onError());

    expect(result.current.nicknameFeedback).toBe("error");
    expect(result.current.statusMessageFeedback).toBe("error");

    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ tone: "error" }));
  });

  it("재입력과 재요청은 이전 필드 오류를 정리한다", () => {
    const { result } = renderProfileForm();

    act(() => result.current.updateNicknameDraft("새 닉네임"));
    submit(result);
    act(() => getMutationOptions().onError());
    expect(result.current.nicknameFeedback).toBe("error");

    submit(result);
    expect(result.current.nicknameFeedback).toBeNull();

    act(() => getMutationOptions().onError());
    expect(result.current.nicknameFeedback).toBe("error");
    act(() => result.current.updateNicknameDraft("다른 닉네임"));
    expect(result.current.nicknameFeedback).toBeNull();
  });

  it("값을 수정한 필드의 오류만 해제한다", () => {
    const { result } = renderProfileForm();

    act(() => result.current.updateNicknameDraft("새 닉네임"));
    act(() => result.current.updateStatusMessageDraft("새 메시지"));
    submit(result);
    act(() => getMutationOptions().onError());

    act(() => result.current.updateNicknameDraft("다른 닉네임"));

    expect(result.current.nicknameFeedback).toBeNull();
    expect(result.current.statusMessageFeedback).toBe("error");
  });
});
