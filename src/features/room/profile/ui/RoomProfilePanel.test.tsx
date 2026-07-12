import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePublicUserBadges } from "@/src/features/badge/hooks/usePublicUserBadges";
import { useFollowingRelationship } from "@/src/features/follow/following/hooks/useFollowingRelationship";
import { useMusicPower } from "@/src/features/user/profile/hooks/useMusicPower";
import { useRecommendMusicPower } from "@/src/features/user/profile/hooks/useRecommendMusicPower";
import { useUserProfile } from "@/src/features/user/profile/hooks/useUserProfile";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import RoomProfilePanel from "./RoomProfilePanel";

vi.mock("next/image", () => ({
  default: () => <span data-testid="profile-image" />,
}));
vi.mock("@/src/features/badge/hooks/usePublicUserBadges", () => ({
  usePublicUserBadges: vi.fn(),
}));
vi.mock("@/src/features/follow/following/hooks/useFollowingRelationship", () => ({
  useFollowingRelationship: vi.fn(),
}));
vi.mock("@/src/features/user/profile/hooks/useMusicPower", () => ({
  useMusicPower: vi.fn(),
}));
vi.mock("@/src/features/user/profile/hooks/useRecommendMusicPower", () => ({
  useRecommendMusicPower: vi.fn(),
}));
vi.mock("@/src/features/user/profile/hooks/useUserProfile", () => ({
  useUserProfile: vi.fn(),
}));
vi.mock("@/src/features/user/session/hooks/useMe", () => ({
  useMe: vi.fn(),
}));
vi.mock("@/src/features/follow/follow/ui/FollowToggleButton", () => ({
  default: () => <button type="button">팔로우</button>,
}));

const requester = {
  avatarUrl: null,
  nickname: "대상",
  slug: "target-user",
  userId: 2,
};
const recommendMutation: Partial<ReturnType<typeof useRecommendMusicPower>> = {
  error: null,
  isPending: false,
  mutate: vi.fn(),
};

describe("RoomProfilePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMe).mockReturnValue({
      data: {
        nickname: "나",
        profileImageUrl: null,
        slug: "me",
        userId: 1,
      },
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useMe>);
    vi.mocked(useUserProfile).mockReturnValue({
      data: {
        nickname: "대상",
        profileImageUrl: null,
        queuingCount: 1234,
        slug: "target-user",
      },
      isLoading: false,
    } as ReturnType<typeof useUserProfile>);
    vi.mocked(usePublicUserBadges).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof usePublicUserBadges>);
    vi.mocked(useFollowingRelationship).mockReturnValue({
      data: false,
    } as ReturnType<typeof useFollowingRelationship>);
    vi.mocked(useMusicPower).mockReturnValue({
      data: {
        musicPower: 55,
        recommendedByMe: false,
        targetUserSlug: "target-user",
      },
      isLoading: false,
    } as ReturnType<typeof useMusicPower>);
    vi.mocked(useRecommendMusicPower).mockReturnValue(
      recommendMutation as ReturnType<typeof useRecommendMusicPower>,
    );
  });

  it("방 프로필에 실제 통계와 하드코딩 이용 시간을 표시한다", () => {
    render(<RoomProfilePanel currentRequester={requester} />);

    expect(screen.getByText("1,234")).toBeInTheDocument();
    expect(screen.getByText("55")).toBeInTheDocument();
    expect(screen.getByText("이용 시간")).toBeInTheDocument();
    expect(screen.getByText("개발 중입니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "음악력 추천" })).toBeEnabled();
    expect(
      screen.getByRole("button", {
        name: "음악력 추천 취소는 아직 지원하지 않습니다",
      }),
    ).toBeDisabled();
  });

  it("본인 프로필에서는 추천 버튼을 숨긴다", () => {
    vi.mocked(useMe).mockReturnValue({
      data: {
        nickname: "대상",
        profileImageUrl: null,
        slug: "target-user",
        userId: 2,
      },
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useMe>);

    render(<RoomProfilePanel currentRequester={requester} />);

    expect(screen.queryByRole("button", { name: "음악력 추천" })).not.toBeInTheDocument();
  });

  it("비로그인 또는 이미 추천한 경우 위 화살표를 비활성화한다", () => {
    vi.mocked(useMe).mockReturnValue({
      data: null,
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useMe>);
    const { rerender } = render(<RoomProfilePanel currentRequester={requester} />);
    expect(
      screen.getByRole("button", {
        name: "로그인 후 음악력을 추천할 수 있습니다",
      }),
    ).toBeDisabled();

    vi.mocked(useMe).mockReturnValue({
      data: {
        nickname: "나",
        profileImageUrl: null,
        slug: "me",
      },
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useMe>);
    vi.mocked(useMusicPower).mockReturnValue({
      data: {
        musicPower: 55,
        recommendedByMe: true,
        targetUserSlug: "target-user",
      },
      isLoading: false,
    } as ReturnType<typeof useMusicPower>);
    rerender(<RoomProfilePanel currentRequester={requester} />);

    expect(
      screen.getByRole("button", { name: "이미 음악력을 추천했습니다" }),
    ).toBeDisabled();
  });

  it("추천 상태 조회에 실패하면 위 화살표를 비활성화한다", () => {
    vi.mocked(useMusicPower).mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
    } as ReturnType<typeof useMusicPower>);

    render(<RoomProfilePanel currentRequester={requester} />);

    expect(
      screen.getByRole("button", {
        name: "음악력 추천 상태를 확인할 수 없습니다",
      }),
    ).toBeDisabled();
  });

  it("대상 slug가 아직 없으면 준비 중 안내로 추천을 비활성화한다", () => {
    vi.mocked(useMusicPower).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useMusicPower>);

    render(
      <RoomProfilePanel
        currentRequester={{ ...requester, slug: null, userId: 3 }}
      />,
    );

    expect(
      screen.getByRole("button", { name: "추천 대상 정보를 준비 중입니다" }),
    ).toBeDisabled();
  });
});
