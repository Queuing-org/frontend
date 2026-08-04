import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMyBadges } from "@/src/features/badge/hooks/useMyBadges";
import { useClearRepresentativeBadge } from "@/src/features/badge/hooks/useClearRepresentativeBadge";
import { useSetRepresentativeBadge } from "@/src/features/badge/hooks/useSetRepresentativeBadge";
import { useProfileSettingsForm } from "../hooks/useProfileSettingsForm";
import ProfileSettingsTab from "./ProfileSettingsTab";

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
  useProfileSettingsForm: vi.fn(),
}));
vi.mock("./components/ProfileStats", () => ({
  default: () => <div data-testid="profile-stats" />,
}));

const mutate = vi.fn();
const clearMutate = vi.fn();
const resetSetMutation = vi.fn();
const resetClearMutation = vi.fn();
const handleNicknameSubmit = vi.fn();
const handleStatusMessageSubmit = vi.fn();

function mockProfileForm(
  overrides: Partial<ReturnType<typeof useProfileSettingsForm>> = {},
) {
  vi.mocked(useProfileSettingsForm).mockReturnValue({
    canUpdateNickname: false,
    canUpdateStatusMessage: false,
    handleNicknameSubmit,
    handleStatusMessageSubmit,
    hasProfile: true,
    isMeError: false,
    isMeLoading: false,
    isUpdatingProfile: false,
    me: {
      nickname: "민지",
      profileImageUrl: null,
      slug: "minji",
    },
    nickname: "민지",
    profileImageSrc: "/images/default-profile.png",
    statusMessage: "",
    successMessage: null,
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
    expect(mutate).not.toHaveBeenCalled();
  });

  it("설정에서 최애 곡 항목을 표시하지 않는다", () => {
    render(<ProfileSettingsTab />);

    expect(screen.queryByText("최애 곡")).not.toBeInTheDocument();
  });

  it("획득한 칭호를 선택하면 badgeCode만 대표 칭호 mutation에 전달한다", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsTab />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "칭호" }),
      "ROOM_CREATE_00002",
    );

    expect(mutate).toHaveBeenCalledWith({ badgeCode: "ROOM_CREATE_00002" });
    expect(resetClearMutation).toHaveBeenCalledOnce();
  });

  it("한 줄 메시지가 바뀌면 해당 행의 수정 버튼만 활성화한다", () => {
    mockProfileForm({ canUpdateStatusMessage: true });
    render(<ProfileSettingsTab />);

    expect(
      screen.getByRole("button", { name: "사용자 이름 수정" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "한 줄 메시지 수정" }),
    ).toBeEnabled();
  });
});
