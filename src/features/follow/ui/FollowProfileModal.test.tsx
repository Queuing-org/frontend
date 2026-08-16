import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePublicUserBadges } from "@/src/features/badge/hooks/usePublicUserBadges";
import { useMusicPower } from "@/src/features/user/profile/hooks/useMusicPower";
import { useUserProfile } from "@/src/features/user/profile/hooks/useUserProfile";
import FollowProfileModal from "./FollowProfileModal";

vi.mock("@/src/features/badge/hooks/usePublicUserBadges", () => ({
  usePublicUserBadges: vi.fn(),
}));
vi.mock("@/src/features/user/profile/hooks/useMusicPower", () => ({
  useMusicPower: vi.fn(),
}));
vi.mock("@/src/features/user/profile/hooks/useUserProfile", () => ({
  useUserProfile: vi.fn(),
}));
vi.mock("@/src/features/follow/follow/ui/FollowToggleButton", () => ({
  default: ({ targetSlug }: { targetSlug: string }) => (
    <button type="button">{targetSlug} 팔로우</button>
  ),
}));
vi.mock("@/src/features/follow/blocked/ui/BlockUserModal", () => ({
  default: ({
    onBlocked,
    target,
  }: {
    onBlocked: (target: { nickname: string; slug: string }) => void;
    target: { nickname: string; slug: string } | null;
  }) =>
    target ? (
      <button type="button" onClick={() => onBlocked(target)}>
        차단 성공
      </button>
    ) : null,
}));

const followUser = {
  cursorId: 1,
  nickname: "목록 닉네임",
  online: false,
  presenceVersion: 0,
  profileImageUrl: null,
  room: null,
  slug: "profile-user",
};

describe("FollowProfileModal", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 768 });
    vi.mocked(useUserProfile).mockReturnValue({
      data: {
        listeningDurationSeconds: 3_660,
        musicPower: 77,
        relationship: "NONE",
        nickname: "공개 닉네임",
        profileImageUrl: null,
        queuingCount: 12,
        representativeBadge: { badgeCode: "rhythm-master", name: "리듬 장인" },
        slug: "profile-user",
        statusMessage: "오늘도 큐잉",
      },
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useUserProfile>);
    vi.mocked(useMusicPower).mockReturnValue({ data: undefined } as ReturnType<
      typeof useMusicPower
    >);
    vi.mocked(usePublicUserBadges).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof usePublicUserBadges>);
  });

  it("기본 compact 높이에서는 내부 스크롤 모드를 켜지 않는다", () => {
    render(
      <FollowProfileModal
        onBlocked={vi.fn()}
        onClose={vi.fn()}
        user={followUser}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "공개 닉네임 프로필 상세" }),
    ).not.toHaveAttribute("data-height-constrained");
  });

  it("안전 여백을 포함한 사용 가능 높이가 부족할 때만 패널을 줄여 스크롤 모드로 전환한다", () => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 300 });

    render(
      <FollowProfileModal
        onBlocked={vi.fn()}
        onClose={vi.fn()}
        user={followUser}
      />,
    );

    const dialog = screen.getByRole("dialog", {
      name: "공개 닉네임 프로필 상세",
    });
    expect(dialog).toHaveAttribute("data-height-constrained", "true");
    expect(dialog.firstElementChild).toHaveStyle({ height: "160px" });
  });

  it("모바일에서는 12px 상하 안전 여백을 제외하고 380px 기본 높이를 유지한다", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 500 });

    render(
      <FollowProfileModal
        onBlocked={vi.fn()}
        onClose={vi.fn()}
        user={followUser}
      />,
    );

    const dialog = screen.getByRole("dialog", {
      name: "공개 닉네임 프로필 상세",
    });
    expect(dialog).not.toHaveAttribute("data-height-constrained");
    expect(dialog.firstElementChild).toHaveStyle({ height: "380px" });
  });

  it("프로필 통계와 음악력 값을 2줄 텍스트로 표시한다", () => {
    render(
      <FollowProfileModal
        onBlocked={vi.fn()}
        onClose={vi.fn()}
        user={followUser}
      />,
    );

    expect(screen.getByText("공개 닉네임")).toBeInTheDocument();
    expect(screen.queryByText("공개 프로필")).not.toBeInTheDocument();
    expect(screen.getByText("리듬 장인")).toBeInTheDocument();
    expect(screen.getByText("오늘도 큐잉")).toBeInTheDocument();
    expect(screen.getByText("공개 닉네임")).toHaveAttribute(
      "data-line-clamp",
      "2",
    );
    expect(screen.getByText("오늘도 큐잉")).toHaveAttribute(
      "data-line-clamp",
      "2",
    );
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("77")).toBeInTheDocument();
    expect(screen.queryByText("PROFILE")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "프로필 상세 닫기" }),
    ).not.toBeInTheDocument();
    expect(document.querySelectorAll("[data-drag-handle='true']")).toHaveLength(5);
    expect(
      screen.getByRole("dialog", { name: "공개 닉네임 프로필 상세" })
        .firstElementChild,
    ).toHaveStyle({ height: "304px", width: "240px" });
    expect(screen.queryByRole("button", { name: "음악력 올리기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "음악력 내리기" })).not.toBeInTheDocument();
  });

  it("닫기 버튼 없이 Escape로 상세를 닫는다", () => {
    const onClose = vi.fn();
    render(
      <FollowProfileModal
        onBlocked={vi.fn()}
        onClose={onClose}
        user={followUser}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("관리 메뉴는 차단만 제공하고 성공하면 상세를 닫는다", async () => {
    const user = userEvent.setup();
    const onBlocked = vi.fn();
    const onClose = vi.fn();
    render(
      <FollowProfileModal
        onBlocked={onBlocked}
        onClose={onClose}
        user={followUser}
      />,
    );

    await user.click(screen.getByRole("button", { name: "관리" }));
    const menu = screen.getByRole("menu", { name: "친구 프로필 관리" });
    expect(menu).toHaveTextContent("차단");
    expect(menu).not.toHaveTextContent("신고");
    await user.click(screen.getByRole("menuitem", { name: "차단" }));
    await user.click(screen.getByRole("button", { name: "차단 성공" }));

    expect(onBlocked).toHaveBeenCalledWith("profile-user");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
