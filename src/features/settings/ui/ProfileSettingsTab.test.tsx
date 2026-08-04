import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBadgeCatalog } from "@/src/features/badge/hooks/useBadgeCatalog";
import { useSetRepresentativeBadge } from "@/src/features/badge/hooks/useSetRepresentativeBadge";
import { useProfileSettingsForm } from "../hooks/useProfileSettingsForm";
import ProfileSettingsTab from "./ProfileSettingsTab";

vi.mock("next/image", () => ({
  default: () => <span data-testid="profile-image" />,
}));
vi.mock("@/src/features/badge/hooks/useBadgeCatalog", () => ({
  useBadgeCatalog: vi.fn(),
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

describe("설정 칭호 목록", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useProfileSettingsForm).mockReturnValue({
      canUpdateProfile: false,
      handleProfileSubmit: vi.fn(),
      hasProfile: true,
      isMeError: false,
      isMeLoading: false,
      isUpdatingProfile: false,
      me: {
        nickname: "민지",
        profileImageUrl: null,
        representativeBadge: {
          badgeCode: "ROOM_CREATE_00001",
          name: "방 팠음",
        },
        slug: "minji",
      },
      nickname: "민지",
      profileImageSrc: "/images/default-profile.png",
      statusMessage: "",
      successMessage: null,
      updateError: null,
      updateNicknameDraft: vi.fn(),
      updateStatusMessageDraft: vi.fn(),
    } as ReturnType<typeof useProfileSettingsForm>);
    vi.mocked(useBadgeCatalog).mockReturnValue({
      data: {
        badges: [
          {
            acquired: false,
            acquisitionHint: "방을 더 만들어 보세요.",
            active: true,
            badgeCode: "ROOM_CREATE_00010",
            category: "ROOM_CREATION",
            description: "누적 방 생성 10회 달성",
            name: "방 열 번 팠음",
            tier: "TIER_2",
          },
          {
            acquired: true,
            acquisitionHint: "방을 생성해 보세요.",
            active: true,
            badgeCode: "ROOM_CREATE_00001",
            category: "ROOM_CREATION",
            description: "누적 방 생성 1회 달성",
            name: "방 팠음",
            tier: "TIER_1",
          },
          {
            acquired: true,
            acquisitionHint: "방을 두 번 생성해 보세요.",
            active: true,
            badgeCode: "ROOM_CREATE_00002",
            category: "ROOM_CREATION",
            description: "누적 방 생성 2회 달성",
            name: "방 또 팠음",
            tier: "TIER_1",
          },
        ],
      },
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useBadgeCatalog>);
    vi.mocked(useSetRepresentativeBadge).mockReturnValue({
      error: null,
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useSetRepresentativeBadge>);
  });

  it("카탈로그 acquired 값으로 선택 가능 여부를 정하고 현재 대표 칭호를 표시한다", () => {
    render(<ProfileSettingsTab />);

    const select = screen.getByRole("combobox", { name: "칭호" });
    const options = screen.getAllByRole("option");

    expect(select).toHaveValue("ROOM_CREATE_00001");
    expect(options.map((option) => option.textContent)).toEqual([
      "대표 칭호 선택",
      "방 팠음",
      "방 또 팠음",
      "방 열 번 팠음",
    ]);
    expect(screen.getByRole("option", { name: "방 팠음" })).toBeEnabled();
    expect(
      screen.getByRole("option", { name: "방 열 번 팠음" }),
    ).toBeDisabled();
  });

  it("획득한 칭호를 선택하면 badgeCode만 대표 칭호 mutation에 전달한다", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsTab />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "칭호" }),
      "ROOM_CREATE_00002",
    );

    expect(mutate).toHaveBeenCalledWith({ badgeCode: "ROOM_CREATE_00002" });
  });
});
