import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePublicUserBadges } from "@/src/features/badge/hooks/usePublicUserBadges";
import { useFollowingRelationship } from "@/src/features/follow/following/hooks/useFollowingRelationship";
import { useMusicPower } from "@/src/features/user/profile/hooks/useMusicPower";
import { useUserProfile } from "@/src/features/user/profile/hooks/useUserProfile";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { useCurrentTrackMusicPowerVote } from "../hooks/useCurrentTrackMusicPowerVote";
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
vi.mock("@/src/features/user/profile/hooks/useUserProfile", () => ({
  useUserProfile: vi.fn(),
}));
vi.mock("@/src/features/user/session/hooks/useMe", () => ({
  useMe: vi.fn(),
}));
vi.mock("../hooks/useCurrentTrackMusicPowerVote", () => ({
  useCurrentTrackMusicPowerVote: vi.fn(),
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
const mutate = vi.fn();

function renderPanel(
  currentRequester: typeof requester | (typeof requester & { slug: null }) =
    requester,
) {
  return render(
    <RoomProfilePanel
      currentRequester={currentRequester}
      roomPassword="secret"
      roomSlug="room"
    />,
  );
}

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
        statusMessage: "좋은 음악 같이 들어요",
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
        myVote: null,
        targetUserSlug: "target-user",
      },
      isLoading: false,
    } as ReturnType<typeof useMusicPower>);
    vi.mocked(useCurrentTrackMusicPowerVote).mockReturnValue({
      error: null,
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useCurrentTrackMusicPowerVote>);
  });

  it("통계와 상태 메시지, 양방향 음악력 버튼을 표시한다", () => {
    renderPanel();

    expect(screen.getByText("1,234")).toBeInTheDocument();
    expect(screen.getByText("55")).toBeInTheDocument();
    expect(screen.getByText("좋은 음악 같이 들어요")).toBeInTheDocument();
    expect(
      screen.getByText(
        "동일한 사용자에게는 1시간에 한 번만 음악력을 평가할 수 있습니다.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "음악력 올리기" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "음악력 내리기" })).toBeEnabled();
  });

  it("기존 투표 상태와 무관하게 클릭한 방향을 PUT mutation에 전달한다", async () => {
    const user = userEvent.setup();
    const { rerender } = renderPanel();

    await user.click(screen.getByRole("button", { name: "음악력 올리기" }));
    expect(mutate).toHaveBeenLastCalledWith({
      roomSlug: "room",
      password: "secret",
      vote: "UPVOTE",
    });

    vi.mocked(useMusicPower).mockReturnValue({
      data: {
        musicPower: 56,
        myVote: "UPVOTE",
        targetUserSlug: "target-user",
      },
      isLoading: false,
    } as ReturnType<typeof useMusicPower>);
    rerender(
      <RoomProfilePanel
        currentRequester={requester}
        roomPassword="secret"
        roomSlug="room"
      />,
    );

    const upButton = screen.getByRole("button", { name: "음악력 올리기" });
    expect(upButton).not.toHaveAttribute("aria-pressed");
    await user.click(upButton);
    expect(mutate).toHaveBeenLastCalledWith({
      roomSlug: "room",
      password: "secret",
      vote: "UPVOTE",
    });
  });

  it("반대 방향 클릭은 DOWNVOTE로 교체한다", async () => {
    const user = userEvent.setup();
    vi.mocked(useMusicPower).mockReturnValue({
      data: {
        musicPower: 56,
        myVote: "UPVOTE",
        targetUserSlug: "target-user",
      },
      isLoading: false,
    } as ReturnType<typeof useMusicPower>);
    renderPanel();

    await user.click(screen.getByRole("button", { name: "음악력 내리기" }));
    expect(mutate).toHaveBeenCalledWith({
      roomSlug: "room",
      password: "secret",
      vote: "DOWNVOTE",
    });
  });

  it("본인과 게스트 신청자는 투표할 수 없다", () => {
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
    const { rerender } = renderPanel();
    expect(
      screen.getAllByRole("button", {
        name: "본인의 음악력에는 투표할 수 없습니다",
      }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("button", {
        name: "본인의 음악력에는 투표할 수 없습니다",
      })[0],
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
    rerender(
      <RoomProfilePanel
        currentRequester={{ ...requester, slug: null }}
        roomSlug="room"
      />,
    );
    expect(
      screen.getAllByRole("button", {
        name: "투표 대상은 회원 신청자만 가능합니다",
      }),
    ).toHaveLength(2);
  });
});
