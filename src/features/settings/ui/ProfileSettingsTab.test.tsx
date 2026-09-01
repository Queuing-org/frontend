import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  STATUS_MESSAGE_MAX_LENGTH: 40,
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

function mockMyBadges(
  overrides: Partial<ReturnType<typeof useMyBadges>> = {},
) {
  vi.mocked(useMyBadges).mockReturnValue({
    data: {
      badges: [
        {
          acquired: true,
          acquiredAt: "2026-06-19T10:00:00.000Z",
          acquisitionRate: 12.34,
          badgeCode: "ROOM_CREATE_00001",
          category: "ROOM_CREATION",
          description: "누적 방 생성 1회 달성",
          name: "방 팠음",
          representative: true,
        },
        {
          acquired: true,
          acquiredAt: "2026-06-20T10:00:00.000Z",
          acquisitionRate: 56.78,
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
    ...overrides,
  } as ReturnType<typeof useMyBadges>);
}

async function openBadgeList(user: ReturnType<typeof userEvent.setup>) {
  const combobox = screen.getByRole("combobox", { name: "칭호" });
  await user.click(combobox);
  return combobox;
}

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
    mockMyBadges();
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

  it("내가 획득한 칭호만 portal 목록에 표시하고 현재 대표 칭호를 선택한다", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsTab />);

    const combobox = screen.getByRole("combobox", { name: "칭호" });
    expect(combobox).toHaveTextContent("방 팠음");
    expect(combobox).toHaveAttribute("aria-expanded", "false");

    await user.click(combobox);
    const options = screen.getAllByRole("option");

    expect(options.map((option) => option.textContent)).toEqual([
      "칭호 없음",
      "방 팠음✓",
      "방 또 팠음",
    ]);
    expect(screen.getByRole("listbox", { name: "칭호" }).parentElement).toBe(
      document.body,
    );
    expect(screen.getByRole("option", { name: "방 팠음" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("option", { name: "방 또 팠음" })).toBeEnabled();
  });

  it("칭호 없음을 선택하면 대표 칭호 해제 mutation을 실행한다", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsTab />);

    await openBadgeList(user);
    await user.click(screen.getByRole("option", { name: "칭호 없음" }));

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
      "40",
    );
    expect(screen.getByText("2/40")).toBeInTheDocument();
  });

  it("획득한 칭호를 선택하면 badgeCode만 대표 칭호 mutation에 전달한다", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsTab />);

    await openBadgeList(user);
    await user.click(screen.getByRole("option", { name: "방 또 팠음" }));

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

  it("칭호 조회 로딩·오류와 대표 칭호 저장 중에는 선택기를 비활성화한다", () => {
    mockMyBadges({ isLoading: true });
    const { rerender } = render(<ProfileSettingsTab />);
    expect(screen.getByRole("combobox", { name: "칭호" })).toBeDisabled();

    mockMyBadges({ isError: true, isLoading: false });
    rerender(<ProfileSettingsTab />);
    expect(screen.getByRole("combobox", { name: "칭호" })).toBeDisabled();

    mockMyBadges();
    vi.mocked(useSetRepresentativeBadge).mockReturnValue({
      error: null,
      isPending: true,
      mutate,
      reset: resetSetMutation,
    } as unknown as ReturnType<typeof useSetRepresentativeBadge>);
    rerender(<ProfileSettingsTab />);
    expect(screen.getByRole("combobox", { name: "칭호" })).toBeDisabled();
  });

  it("목록이 열린 상태에서 저장이 시작되면 portal 목록을 닫는다", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ProfileSettingsTab />);
    await openBadgeList(user);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    vi.mocked(useSetRepresentativeBadge).mockReturnValue({
      error: null,
      isPending: true,
      mutate,
      reset: resetSetMutation,
    } as unknown as ReturnType<typeof useSetRepresentativeBadge>);
    rerender(<ProfileSettingsTab />);

    expect(screen.getByRole("combobox", { name: "칭호" })).toBeDisabled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("획득 칭호 hover 시 획득률과 획득 조건 tooltip을 표시한다", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsTab />);
    await openBadgeList(user);

    const option = screen.getByRole("option", { name: "방 팠음" });
    await user.hover(option);

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("12.34% 사용자가 획득함.");
    expect(tooltip).toHaveTextContent(
      "누적 방 생성 1회 달성하여 획득함.",
    );
    expect(tooltip.parentElement).toBe(document.body);
    expect(option).toHaveAttribute("aria-describedby", tooltip.id);
    expect(tooltip).toHaveAttribute("data-placement", "right");
  });

  it("오른쪽 공간이 부족하면 tooltip을 option 왼쪽으로 전환한다", async () => {
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function getBoundingClientRect() {
        const role = this.getAttribute("role");
        const isTooltip = role === "tooltip";
        const left = role === "option" ? 720 : 700;
        const width = isTooltip ? 250 : 200;
        const top = role === "option" ? 120 : 100;
        const height = isTooltip ? 58 : 40;

        return {
          bottom: top + height,
          height,
          left,
          right: left + width,
          top,
          width,
          x: left,
          y: top,
          toJSON: () => ({}),
        };
      });
    const user = userEvent.setup();
    render(<ProfileSettingsTab />);
    await openBadgeList(user);
    await user.hover(screen.getByRole("option", { name: "방 팠음" }));

    await waitFor(() =>
      expect(screen.getByRole("tooltip")).toHaveAttribute(
        "data-placement",
        "left",
      ),
    );
    rectSpy.mockRestore();
  });

  it("키보드 방향키로 상세를 확인하고 Enter로 즉시 선택한다", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsTab />);
    const combobox = screen.getByRole("combobox", { name: "칭호" });
    combobox.focus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "12.34% 사용자가 획득함.",
    );

    await user.keyboard("{ArrowDown}");
    const secondOption = screen.getByRole("option", { name: "방 또 팠음" });
    expect(combobox).toHaveAttribute("aria-activedescendant", secondOption.id);
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "56.78% 사용자가 획득함.",
    );

    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "12.34% 사용자가 획득함.",
    );
    await user.keyboard("{ArrowDown}");

    await user.keyboard("{Enter}");
    expect(mutate).toHaveBeenCalledWith(
      { badgeCode: "ROOM_CREATE_00002" },
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      }),
    );
    expect(combobox).toHaveFocus();
    expect(combobox).toHaveAttribute("aria-expanded", "false");
  });

  it("hover 중 방향키로 전환하면 활성 칭호의 tooltip으로 갱신한다", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsTab />);
    const combobox = await openBadgeList(user);
    await user.hover(screen.getByRole("option", { name: "방 팠음" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "12.34% 사용자가 획득함.",
    );

    await user.keyboard("{ArrowDown}");

    const secondOption = screen.getByRole("option", { name: "방 또 팠음" });
    expect(combobox).toHaveAttribute("aria-activedescendant", secondOption.id);
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "56.78% 사용자가 획득함.",
    );
  });

  it("Home/End와 Space를 지원하고 Escape 및 바깥 focus로 닫는다", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsTab />);
    const combobox = screen.getByRole("combobox", { name: "칭호" });
    combobox.focus();

    await user.keyboard("{End}");
    expect(combobox).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "방 또 팠음" }).id,
    );
    await user.keyboard("{Home}");
    expect(combobox).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "칭호 없음" }).id,
    );
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(combobox).toHaveFocus();

    await user.keyboard(" ");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{End}");
    await user.keyboard(" ");
    expect(mutate).toHaveBeenCalledWith(
      { badgeCode: "ROOM_CREATE_00002" },
      expect.any(Object),
    );

    await user.click(combobox);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.click(screen.getByLabelText("사용자 이름"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByLabelText("사용자 이름")).toHaveFocus();
  });

  it("잘못된 획득률과 빈 설명에는 fallback tooltip 문구를 표시한다", async () => {
    mockMyBadges({
      data: {
        badges: [
          {
            acquired: true,
            acquiredAt: "2026-06-19T10:00:00.000Z",
            acquisitionRate: null,
            badgeCode: "ROOM_CREATE_00001",
            category: "ROOM_CREATION",
            description: "   ",
            name: "방 팠음",
            representative: true,
          },
        ],
        representativeBadge: {
          badgeCode: "ROOM_CREATE_00001",
          name: "방 팠음",
        },
      },
    });
    const user = userEvent.setup();
    render(<ProfileSettingsTab />);
    await openBadgeList(user);
    await user.hover(screen.getByRole("option", { name: "방 팠음" }));

    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "획득률 정보를 확인할 수 없음.",
    );
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "획득 조건을 확인할 수 없음.",
    );
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

    await openBadgeList(user);
    await user.click(screen.getByRole("option", { name: "방 또 팠음" }));
    const options = mutate.mock.lastCall?.[1] as { onError: (error: ApiError) => void };
    options.onError(new ApiError({ message: "칭호를 저장하지 못했습니다.", status: 500 }));

    expect(notify).toHaveBeenCalledWith({
      dedupeKey: "profile:representative-badge",
      message: "칭호를 저장하지 못했습니다.",
      tone: "error",
    });
  });
});
