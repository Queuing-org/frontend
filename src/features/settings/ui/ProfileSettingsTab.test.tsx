import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMyBadges } from "@/src/features/badge/hooks/useMyBadges";
import { useClearRepresentativeBadge } from "@/src/features/badge/hooks/useClearRepresentativeBadge";
import { useSetRepresentativeBadge } from "@/src/features/badge/hooks/useSetRepresentativeBadge";
import { useProfileSettingsForm } from "../hooks/useProfileSettingsForm";
import ProfileSettingsTab from "./ProfileSettingsTab";
import { ApiError } from "@/src/shared/api/api-error";

const { notify } = vi.hoisted(() => ({ notify: vi.fn() }));

vi.mock("next/image", () => ({
  default: () => <span data-testid="profile-image" />,
}));
vi.mock("@/src/features/badge/hooks/useMyBadges", () => ({
  useMyBadges: vi.fn(),
}));
vi.mock("@/src/features/badge/hooks/useClearRepresentativeBadge", () => ({
  useClearRepresentativeBadge: vi.fn(),
}));
vi.mock("@/src/features/badge/hooks/useSetRepresentativeBadge", () => ({
  useSetRepresentativeBadge: vi.fn(),
}));
vi.mock("../hooks/useProfileSettingsForm", () => ({
  STATUS_MESSAGE_MAX_LENGTH: 20,
  useProfileSettingsForm: vi.fn(),
}));
vi.mock("@/src/shared/ui/action-feedback/ActionFeedbackProvider", () => ({
  useActionFeedback: () => ({ notify }),
}));
vi.mock("./components/ProfileStats", () => ({
  default: () => <div data-testid="profile-stats" />,
}));

const mutate = vi.fn();
const clearMutate = vi.fn();
const resetSetMutation = vi.fn();
const resetClearMutation = vi.fn();
const clearProfileStatusMessage = vi.fn();
const handleProfileSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
});

function mockProfileForm(
  overrides: Partial<ReturnType<typeof useProfileSettingsForm>> = {},
) {
  vi.mocked(useProfileSettingsForm).mockReturnValue({
    canUpdateProfile: false,
    clearProfileStatusMessage,
    handleProfileSubmit,
    hasProfile: true,
    hasProfileChanges: false,
    isMeError: false,
    isMeLoading: false,
    isUpdatingProfile: false,
    me: {
      nickname: "민지",
      profileImageUrl: null,
      slug: "minji",
    },
    nickname: "민지",
    nicknameFeedback: null,
    profileImageSrc: "/images/default-profile.png",
    statusMessage: "",
    statusMessageFeedback: null,
    updateError: null,
    updateNicknameDraft: vi.fn(),
    updateStatusMessageDraft: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useProfileSettingsForm>);
}

describe("설정 칭호 목록", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileForm();
    vi.mocked(useMyBadges).mockReturnValue({
      data: {
        badges: [
          {
            acquired: true,
            acquiredAt: "2026-06-19T10:00:00.000Z",
            badgeCode: "ROOM_CREATE_00001",
            category: "ROOM_CREATION",
            description: "누적 방 생성 1회 달성",
            name: "방 팠음",
            representative: true,
          },
          {
            acquired: true,
            acquiredAt: "2026-06-20T10:00:00.000Z",
            badgeCode: "ROOM_CREATE_00002",
            category: "ROOM_CREATION",
            description: "누적 방 생성 2회 달성",
            name: "방 또 팠음",
            representative: false,
          },
        ],
        representativeBadge: {
          badgeCode: "ROOM_CREATE_00001",
          name: "방 팠음",
        },
      },
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useMyBadges>);
    vi.mocked(useSetRepresentativeBadge).mockReturnValue({
      error: null,
      isPending: false,
      mutate,
      reset: resetSetMutation,
    } as unknown as ReturnType<typeof useSetRepresentativeBadge>);
    vi.mocked(useClearRepresentativeBadge).mockReturnValue({
      error: null,
      isPending: false,
      mutate: clearMutate,
      reset: resetClearMutation,
    } as unknown as ReturnType<typeof useClearRepresentativeBadge>);
  });

  it("내가 획득한 칭호만 선택지로 표시하고 현재 대표 칭호를 선택한다", () => {
    render(<ProfileSettingsTab />);

    const select = screen.getByRole("combobox", { name: "칭호" });
    const options = screen.getAllByRole("option");

    expect(select).toHaveValue("ROOM_CREATE_00001");
    expect(options.map((option) => option.textContent)).toEqual([
      "칭호 없음",
      "방 팠음",
      "방 또 팠음",
    ]);
    expect(screen.getByRole("option", { name: "방 팠음" })).toBeEnabled();
    expect(screen.getByRole("option", { name: "방 또 팠음" })).toBeEnabled();
  });

  it("칭호 없음을 선택하면 대표 칭호 해제 mutation을 실행한다", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsTab />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "칭호" }),
      "",
    );

    expect(clearMutate).toHaveBeenCalledOnce();
    expect(resetSetMutation).toHaveBeenCalledOnce();
    expect(resetClearMutation).toHaveBeenCalledOnce();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("닉네임과 최애곡의 최대 길이와 현재 글자 수를 표시한다", () => {
    mockProfileForm({ nickname: "민지", statusMessage: "재즈" });
    render(<ProfileSettingsTab />);

    expect(screen.getByLabelText("사용자 이름")).toHaveAttribute(
      "maxlength",
      "19",
    );
    expect(screen.getByText("2/19")).toBeInTheDocument();
    expect(screen.getByLabelText("최애곡")).toHaveAttribute(
      "maxlength",
      "20",
    );
    expect(screen.getByText("2/20")).toBeInTheDocument();
  });

  it("획득한 칭호를 선택하면 badgeCode만 대표 칭호 mutation에 전달한다", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsTab />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "칭호" }),
      "ROOM_CREATE_00002",
    );

    expect(mutate).toHaveBeenCalledWith(
      { badgeCode: "ROOM_CREATE_00002" },
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      }),
    );
    expect(resetClearMutation).toHaveBeenCalledOnce();
    expect(resetSetMutation).toHaveBeenCalledOnce();
    expect(clearProfileStatusMessage).toHaveBeenCalledOnce();
  });

  it("프로필 변경이 있으면 단일 완료 버튼을 활성화한다", () => {
    mockProfileForm({ canUpdateProfile: true, hasProfileChanges: true });
    render(<ProfileSettingsTab />);

    expect(screen.getByRole("button", { name: "완료" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /수정/ })).not.toBeInTheDocument();
  });

  it("프로필 변경이 없으면 완료 버튼을 숨기고 invalid 변경이면 비활성화한다", () => {
    const { rerender } = render(<ProfileSettingsTab />);

    expect(screen.queryByRole("button", { name: "완료" })).not.toBeInTheDocument();

    mockProfileForm({ canUpdateProfile: false, hasProfileChanges: true });
    rerender(<ProfileSettingsTab />);

    expect(screen.getByRole("button", { name: "완료" })).toBeDisabled();
  });

  it("완료 버튼을 footer 행에 둔다", () => {
    mockProfileForm({ hasProfileChanges: true });
    render(<ProfileSettingsTab />);

    const feedback = screen.getByRole("status");
    const completeButton = screen.getByRole("button", { name: "완료" });

    expect(feedback.parentElement).toBe(completeButton.parentElement);
  });

  it("프로필 저장 중에는 칭호 변경을 막아 active mutation을 유지한다", () => {
    mockProfileForm({ isUpdatingProfile: true });
    render(<ProfileSettingsTab />);

    expect(screen.getByRole("combobox", { name: "칭호" })).toBeDisabled();
  });

  it("일반 Enter는 통합 저장하고 한글 조합 중 Enter는 무시한다", async () => {
    const user = userEvent.setup();
    mockProfileForm({ canUpdateProfile: true, hasProfileChanges: true });
    render(<ProfileSettingsTab />);
    const nicknameInput = screen.getByLabelText("사용자 이름");

    await user.click(nicknameInput);
    await user.keyboard("{Enter}");
    expect(handleProfileSubmit).toHaveBeenCalledOnce();

    handleProfileSubmit.mockClear();
    expect(
      fireEvent.keyDown(nicknameInput, {
        key: "Enter",
        keyCode: 229,
        isComposing: true,
      }),
    ).toBe(false);
    expect(handleProfileSubmit).not.toHaveBeenCalled();
  });

  it("실패 필드에는 aria-invalid를 연결하고 인라인 결과 문구는 두지 않는다", () => {
    mockProfileForm({
      nicknameFeedback: null,
      statusMessageFeedback: "error",
    });
    render(<ProfileSettingsTab />);

    expect(screen.getByLabelText("사용자 이름")).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByLabelText("최애곡")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("프로필 수정 오류는 필드 상태로만 남기고 인라인에 노출하지 않는다", () => {
    mockProfileForm({
      nicknameFeedback: "error",
      updateError: new ApiError({
        message: "이미 사용 중인 이름입니다.",
        status: 409,
      }),
    });
    render(<ProfileSettingsTab />);

    expect(screen.getByLabelText("사용자 이름")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText(/이미 사용 중인 이름/)).not.toBeInTheDocument();
  });

  it("칭호 저장 실패는 공통 오류 알림으로 표시한다", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsTab />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "칭호" }),
      "ROOM_CREATE_00002",
    );
    const options = mutate.mock.lastCall?.[1] as { onError: (error: ApiError) => void };
    options.onError(new ApiError({ message: "칭호를 저장하지 못했습니다.", status: 500 }));

    expect(notify).toHaveBeenCalledWith({
      dedupeKey: "profile:representative-badge",
      message: "칭호를 저장하지 못했습니다.",
      tone: "error",
    });
  });
});
