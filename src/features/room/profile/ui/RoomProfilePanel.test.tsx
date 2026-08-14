import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePublicUserBadges } from "@/src/features/badge/hooks/usePublicUserBadges";
import { useMusicPower } from "@/src/features/user/profile/hooks/useMusicPower";
import { useUserProfile } from "@/src/features/user/profile/hooks/useUserProfile";
import { useKickRoomParticipant } from "@/src/features/room/hooks/useKickRoomParticipant";
import { useTransferRoomOwner } from "@/src/features/room/hooks/useTransferRoomOwner";
import { useCurrentTrackMusicPowerVote } from "../hooks/useCurrentTrackMusicPowerVote";
import RoomProfilePanel from "./RoomProfilePanel";

vi.mock("next/image", () => ({
  default: ({
    height,
    src,
    width,
  }: {
    height?: number;
    src: string;
    width?: number;
  }) => (
    <span
      data-testid={`image-${src}`}
      data-height={height}
      data-width={width}
    />
  ),
}));
vi.mock("@/src/features/badge/hooks/usePublicUserBadges", () => ({
  usePublicUserBadges: vi.fn(),
}));
vi.mock("@/src/features/user/profile/hooks/useMusicPower", () => ({
  useMusicPower: vi.fn(),
}));
vi.mock("@/src/features/user/profile/hooks/useUserProfile", () => ({
  useUserProfile: vi.fn(),
}));
vi.mock("../hooks/useCurrentTrackMusicPowerVote", () => ({
  useCurrentTrackMusicPowerVote: vi.fn(),
}));
vi.mock("@/src/features/room/hooks/useKickRoomParticipant", () => ({
  useKickRoomParticipant: vi.fn(),
}));
vi.mock("@/src/features/room/hooks/useTransferRoomOwner", () => ({
  useTransferRoomOwner: vi.fn(),
}));
vi.mock("@/src/features/follow/follow/ui/FollowToggleButton", () => ({
  default: ({
    followingLabel,
    initialRelationship,
    role,
  }: {
    followingLabel?: string;
    initialRelationship?: string;
    role?: "menuitem";
  }) => (
    <button type="button" role={role}>
      {initialRelationship === "FOLLOWING"
        ? (followingLabel ?? "언팔로우")
        : "팔로우"}
    </button>
  ),
}));
vi.mock("@/src/features/follow/blocked/ui/BlockUserModal", () => ({
  default: ({
    onBlocked,
    target,
  }: {
    onBlocked?: (target: { nickname: string; slug: string }) => void;
    target: { nickname: string; slug: string } | null;
  }) =>
    target ? (
      <div role="dialog" aria-label="차단 확인">
        <button type="button" onClick={() => onBlocked?.(target)}>
          차단 실행
        </button>
      </div>
    ) : null,
}));
vi.mock("@/src/features/room/chat/ui/ReportChatMessageModal", () => ({
  default: ({
    target,
  }: {
    target: { messageKey: string } | null;
  }) =>
    target ? (
      <div role="dialog" aria-label="채팅 메시지 신고">
        {target.messageKey}
      </div>
    ) : null,
}));

const requester = {
  avatarUrl: null,
  nickname: "대상",
  slug: "target-user",
  userId: 2,
};
const currentUser = {
  nickname: "나",
  profileImageUrl: null,
  slug: "me",
  userId: 1,
};
const roomMeta = {
  activeUsersCount: 2,
  hasPassword: false,
  isPublic: true,
  owner: {
    nickname: "방장",
    profileImageUrl: null,
    slug: "owner",
  },
  slug: "room",
  tags: [],
  title: "테스트 방",
};
const mutate = vi.fn();
const kickMutate = vi.fn();
const kickReset = vi.fn();
const transferMutate = vi.fn();
const transferReset = vi.fn();
const onUserBlocked = vi.fn();
const resolveParticipantByUserSlug = vi.fn();

function renderPanel(
  currentRequester: typeof requester | (typeof requester & { slug: null }) =
    requester,
  options?: {
    currentUser?: typeof currentUser | null;
    hasUnloadedParticipants?: boolean;
    kickTarget?: { userSlug: string } | null;
    onUserBlocked?: (userSlug: string) => void;
    reportMessageKey?: string | null;
    roomMeta?: typeof roomMeta;
  },
) {
  return render(
    <RoomProfilePanel
      currentUser={
        options?.currentUser === undefined ? currentUser : options.currentUser
      }
      currentRequester={currentRequester}
      hasUnloadedParticipants={options?.hasUnloadedParticipants}
      isCurrentUserLoading={false}
      kickTarget={
        options?.kickTarget === undefined
          ? { userSlug: "target-user" }
          : options.kickTarget
      }
      onUserBlocked={options?.onUserBlocked ?? onUserBlocked}
      reportMessageKey={
        options?.reportMessageKey === undefined
          ? "message-key"
          : options.reportMessageKey
      }
      resolveParticipantByUserSlug={resolveParticipantByUserSlug}
      roomMeta={options?.roomMeta ?? roomMeta}
      roomPassword="secret"
      roomSlug="room"
    />,
  );
}

describe("RoomProfilePanel", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    resolveParticipantByUserSlug.mockResolvedValue(null);
    vi.mocked(useUserProfile).mockReturnValue({
      data: {
        nickname: "대상",
        listeningDurationSeconds: 14_700,
        relationship: "NONE",
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
    vi.mocked(useKickRoomParticipant).mockReturnValue({
      error: null,
      isPending: false,
      mutate: kickMutate,
      reset: kickReset,
    } as unknown as ReturnType<typeof useKickRoomParticipant>);
    vi.mocked(useTransferRoomOwner).mockReturnValue({
      error: null,
      isPending: false,
      mutate: transferMutate,
      reset: transferReset,
    } as unknown as ReturnType<typeof useTransferRoomOwner>);
  });

  it("통계와 한 줄 소개, 양방향 음악력 버튼을 표시한다", () => {
    renderPanel();

    expect(screen.getByText("1,234")).toBeInTheDocument();
    expect(screen.getByText("4시간 5분")).toBeInTheDocument();
    expect(screen.getByText("55")).toBeInTheDocument();
    expect(screen.getByText("좋은 음악 같이 들어요")).toBeInTheDocument();
    expect(screen.getByText("한 줄 소개")).toBeInTheDocument();
    expect(screen.queryByText("최애곡")).not.toBeInTheDocument();
    expect(screen.queryByText(/1시간에 한 번/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "음악력 올리기" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "음악력 내리기" })).toBeEnabled();
  });

  it("공개 프로필에 칭호와 음악력이 있으면 중복 fallback 조회를 비활성화한다", () => {
    vi.mocked(useUserProfile).mockReturnValue({
      data: {
        musicPower: 42,
        nickname: "대상",
        profileImageUrl: null,
        representativeBadge: {
          badgeCode: "ROOM_CREATE_00001",
          name: "방 팠음",
        },
        slug: "target-user",
      },
      isLoading: false,
    } as ReturnType<typeof useUserProfile>);

    renderPanel();

    expect(useMusicPower).toHaveBeenLastCalledWith(null);
    expect(usePublicUserBadges).toHaveBeenLastCalledWith(null);
    expect(screen.getByText("방 팠음")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("공개 프로필 조회가 실패하면 칭호와 음악력 fallback을 활성화한다", () => {
    vi.mocked(useUserProfile).mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
    } as ReturnType<typeof useUserProfile>);

    renderPanel();

    expect(useMusicPower).toHaveBeenLastCalledWith("target-user");
    expect(usePublicUserBadges).toHaveBeenLastCalledWith("target-user");
  });

  it("기존 투표 상태와 무관하게 클릭한 방향을 PUT mutation에 전달한다", async () => {
    const user = userEvent.setup();
    const { rerender } = renderPanel();

    await user.click(screen.getByRole("button", { name: "음악력 올리기" }));
    expect(mutate).toHaveBeenLastCalledWith(
      {
        targetUserSlug: "target-user",
        vote: "UPVOTE",
      },
      expect.objectContaining({ onError: expect.any(Function) }),
    );

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
        currentUser={currentUser}
        currentRequester={requester}
        isCurrentUserLoading={false}
        kickTarget={{ userSlug: "target-user" }}
        onUserBlocked={onUserBlocked}
        reportMessageKey="message-key"
        roomMeta={roomMeta}
        roomPassword="secret"
        roomSlug="room"
      />,
    );

    const upButton = screen.getByRole("button", { name: "음악력 올리기" });
    expect(upButton).not.toHaveAttribute("aria-pressed");
    await user.click(upButton);
    expect(mutate).toHaveBeenLastCalledWith(
      {
        targetUserSlug: "target-user",
        vote: "UPVOTE",
      },
      expect.objectContaining({ onError: expect.any(Function) }),
    );
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
    expect(mutate).toHaveBeenCalledWith(
      {
        targetUserSlug: "target-user",
        vote: "DOWNVOTE",
      },
      expect.objectContaining({ onError: expect.any(Function) }),
    );
  });

  it("서버 오류를 음악력 제목 오른쪽에 2초 동안 표시한다", () => {
    vi.useFakeTimers();
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "음악력 올리기" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    const mutationOptions = mutate.mock.calls.at(-1)?.[1] as {
      onError: (error: Error) => void;
    };
    act(() => {
      mutationOptions.onError(
        new Error(
          "같은 사용자에게는 1시간에 한 번만 음악력을 올리거나 내릴 수 있습니다.",
        ),
      );
    });

    const notice = screen.getByRole("alert");
    expect(notice).toHaveTextContent(
      "같은 사용자에게는 1시간에 한 번만 음악력을 올리거나 내릴 수 있습니다.",
    );
    expect(screen.getByText("음악력").parentElement).toContainElement(notice);

    act(() => {
      vi.advanceTimersByTime(1_999);
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("신청자가 바뀌면 이전 신청자의 음악력 안내를 표시하지 않는다", () => {
    const { rerender } = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "음악력 올리기" }));
    const mutationOptions = mutate.mock.calls.at(-1)?.[1] as {
      onError: (error: Error) => void;
    };
    act(() => {
      mutationOptions.onError(new Error("음악력 투표 오류"));
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();

    rerender(
      <RoomProfilePanel
        currentUser={currentUser}
        currentRequester={{ ...requester, slug: "next-user" }}
        isCurrentUserLoading={false}
        kickTarget={{ userSlug: "next-user" }}
        onUserBlocked={onUserBlocked}
        reportMessageKey="message-key"
        roomMeta={roomMeta}
        roomPassword="secret"
        roomSlug="room"
      />,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("비로그인은 mutation 없이 로그인 필요 안내를 표시한다", () => {
    renderPanel(requester, { currentUser: null });

    const upButton = screen.getByRole("button", { name: "음악력 올리기" });
    expect(upButton).toBeEnabled();

    fireEvent.click(upButton);

    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "로그인 후 음악력을 올리거나 내릴 수 있습니다.",
    );
  });

  it("처리 중이어도 음악력 버튼을 비활성화하지 않는다", () => {
    vi.mocked(useCurrentTrackMusicPowerVote).mockReturnValue({
      error: null,
      isPending: true,
      mutate,
    } as unknown as ReturnType<typeof useCurrentTrackMusicPowerVote>);

    renderPanel();

    expect(screen.getByRole("button", { name: "음악력 올리기" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "음악력 내리기" })).toBeEnabled();
  });

  it("본인에게는 내 노래 상태만 표시하고 음악력·관계 액션을 숨긴다", () => {
    const selfUser = {
      nickname: "대상",
      profileImageUrl: null,
      slug: "target-user",
      userId: 2,
    };
    renderPanel(requester, { currentUser: selfUser });

    expect(screen.getByLabelText("내 신청곡 재생 상태")).toHaveTextContent(
      "내 노래가 나오고 있어요!",
    );
    expect(
      screen.queryByRole("button", { name: "음악력 올리기" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "음악력 내리기" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "관리" }),
    ).not.toBeInTheDocument();
  });

  it("인증 로딩부터 본인 확인까지 음악력 버튼을 노출하지 않는다", () => {
    const selfUser = {
      nickname: "대상",
      profileImageUrl: null,
      slug: "target-user",
      userId: 2,
    };
    const { rerender } = render(
      <RoomProfilePanel
        currentUser={null}
        currentRequester={requester}
        isCurrentUserLoading
        kickTarget={{ userSlug: "target-user" }}
        onUserBlocked={onUserBlocked}
        reportMessageKey="message-key"
        roomMeta={roomMeta}
        roomPassword="secret"
        roomSlug="room"
      />,
    );

    expect(
      screen.queryByRole("button", { name: "음악력 올리기" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "음악력 내리기" }),
    ).not.toBeInTheDocument();

    rerender(
      <RoomProfilePanel
        currentUser={selfUser}
        currentRequester={requester}
        isCurrentUserLoading={false}
        kickTarget={{ userSlug: "target-user" }}
        onUserBlocked={onUserBlocked}
        reportMessageKey="message-key"
        roomMeta={roomMeta}
        roomPassword="secret"
        roomSlug="room"
      />,
    );

    expect(screen.getByLabelText("내 신청곡 재생 상태")).toHaveTextContent(
      "내 노래가 나오고 있어요!",
    );
    expect(
      screen.queryByRole("button", { name: "음악력 올리기" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "음악력 내리기" }),
    ).not.toBeInTheDocument();
  });

  it("게스트 신청자는 음악력에 투표할 수 없다", () => {
    renderPanel({ ...requester, slug: null });

    expect(
      screen.getAllByRole("button", {
        name: "투표 대상은 회원 신청자만 가능합니다",
      }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("button", {
        name: "투표 대상은 회원 신청자만 가능합니다",
      })[0],
    ).toBeDisabled();
  });

  it("프로필 상단 아래에 팔로잉과 관리 액션을 상시 표시한다", () => {
    vi.mocked(useUserProfile).mockReturnValue({
      data: {
        nickname: "대상",
        listeningDurationSeconds: 14_700,
        musicPower: 55,
        profileImageUrl: null,
        relationship: "FOLLOWING",
        slug: "requester",
      },
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useUserProfile>);
    renderPanel();

    expect(screen.getByText("현재 큐잉 중...")).toBeInTheDocument();
    const actions = screen.getByRole("group", { name: "프로필 액션" });
    expect(actions).toContainElement(
      screen.getByRole("button", { name: "팔로잉" }),
    );
    expect(actions).toContainElement(
      screen.getByRole("button", { name: "관리" }),
    );
    expect(screen.queryByText("온라인")).not.toBeInTheDocument();
  });

  it("관리와 음악력 버튼에 지정된 8x8 SVG 아이콘을 사용한다", () => {
    renderPanel();

    [
      "/icons/manage-down.svg",
      "/icons/music-power-up.svg",
      "/icons/music-power-down.svg",
    ].forEach((src) => {
      expect(screen.getByTestId(`image-${src}`)).toHaveAttribute(
        "data-width",
        "8",
      );
      expect(screen.getByTestId(`image-${src}`)).toHaveAttribute(
        "data-height",
        "8",
      );
    });
  });

  it("일반 사용자의 관리 메뉴에는 신고와 차단만 표시한다", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: "관리" }));
    expect(
      screen.getByRole("menu", { name: "프로필 관리" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "팔로우" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "신고" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "차단" })).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "내보내기" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "방장 위임" }),
    ).not.toBeInTheDocument();
  });

  it("관리 버튼 재클릭과 바깥 클릭으로 dropdown을 닫는다", async () => {
    const user = userEvent.setup();
    renderPanel();
    const manageButton = screen.getByRole("button", { name: "관리" });

    await user.click(manageButton);
    expect(
      screen.getByRole("menu", { name: "프로필 관리" }),
    ).toBeInTheDocument();

    await user.click(manageButton);
    expect(
      screen.queryByRole("menu", { name: "프로필 관리" }),
    ).not.toBeInTheDocument();

    await user.click(manageButton);
    await user.click(screen.getByText("한 줄 소개"));
    expect(
      screen.queryByRole("menu", { name: "프로필 관리" }),
    ).not.toBeInTheDocument();
  });

  it("Escape로 관리 메뉴를 닫고 관리 버튼에 포커스를 복원한다", async () => {
    const user = userEvent.setup();
    renderPanel();
    const manageButton = screen.getByRole("button", { name: "관리" });

    await user.click(manageButton);
    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("menu", { name: "프로필 관리" }),
    ).not.toBeInTheDocument();
    expect(manageButton).toHaveFocus();
  });

  it("내보내기 처리 중 다시 연 dropdown도 Escape로 닫는다", async () => {
    const user = userEvent.setup();
    vi.mocked(useKickRoomParticipant).mockReturnValue({
      error: null,
      isPending: true,
      mutate: kickMutate,
      reset: kickReset,
    } as unknown as ReturnType<typeof useKickRoomParticipant>);
    renderPanel(requester, {
      currentUser: { ...currentUser, slug: "owner" },
    });
    const manageButton = screen.getByRole("button", { name: "관리" });

    await user.click(manageButton);
    expect(
      screen.getByRole("menu", { name: "프로필 관리" }),
    ).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("menu", { name: "프로필 관리" }),
    ).not.toBeInTheDocument();
    expect(manageButton).toHaveFocus();
  });

  it("신고는 대상의 최근 채팅 messageKey로 기존 신고 모달을 연다", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: "관리" }));
    await user.click(screen.getByRole("menuitem", { name: "신고" }));

    expect(
      screen.getByRole("dialog", { name: "채팅 메시지 신고" }),
    ).toHaveTextContent("message-key");
  });

  it("신고 가능한 채팅이 없으면 API 성공을 가장하지 않고 안내한다", async () => {
    const user = userEvent.setup();
    renderPanel(requester, { reportMessageKey: null });

    await user.click(screen.getByRole("button", { name: "관리" }));
    await user.click(screen.getByRole("menuitem", { name: "신고" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "신고할 수 있는 채팅 메시지가 없습니다.",
    );
    expect(
      screen.queryByRole("dialog", { name: "채팅 메시지 신고" }),
    ).not.toBeInTheDocument();
  });

  it("차단 액션은 기존 차단 확인 모달을 연다", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: "관리" }));
    await user.click(screen.getByRole("menuitem", { name: "차단" }));

    expect(
      screen.getByRole("dialog", { name: "차단 확인" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "차단 실행" }));
    expect(onUserBlocked).toHaveBeenCalledWith("target-user");
  });

  it("방장이더라도 신청자가 현재 참가자 목록에 없으면 내보내기를 숨긴다", async () => {
    const user = userEvent.setup();
    renderPanel(requester, {
      currentUser: { ...currentUser, slug: "owner" },
      kickTarget: null,
    });

    await user.click(screen.getByRole("button", { name: "관리" }));

    expect(
      screen.queryByRole("menuitem", { name: "내보내기" }),
    ).not.toBeInTheDocument();
  });

  it("미로드 신청자는 메뉴 실행 시에만 cursor lookup 후 내보낸다", async () => {
    const user = userEvent.setup();
    resolveParticipantByUserSlug.mockResolvedValue({
      nickname: "대상",
      participantId: "participant-target",
      participantType: "USER",
      profileImageUrl: null,
      userSlug: "target-user",
    });
    renderPanel(requester, {
      currentUser: { ...currentUser, slug: "owner" },
      hasUnloadedParticipants: true,
      kickTarget: null,
    });

    await user.click(screen.getByRole("button", { name: "관리" }));
    expect(screen.getByRole("menuitem", { name: "내보내기" })).toBeVisible();
    expect(resolveParticipantByUserSlug).not.toHaveBeenCalled();

    await user.click(screen.getByRole("menuitem", { name: "내보내기" }));

    await waitFor(() =>
      expect(resolveParticipantByUserSlug).toHaveBeenCalledWith(
        "target-user",
      ),
    );
    expect(kickMutate).toHaveBeenCalledWith(
      {
        password: "secret",
        slug: "room",
        userSlug: "target-user",
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("미로드 신청자가 실제 참가자가 아니면 방장 위임 mutation을 막는다", async () => {
    const user = userEvent.setup();
    renderPanel(requester, {
      currentUser: { ...currentUser, slug: "owner" },
      hasUnloadedParticipants: true,
      kickTarget: null,
    });

    await user.click(screen.getByRole("button", { name: "관리" }));
    await user.click(screen.getByRole("menuitem", { name: "방장 위임" }));

    expect(
      await screen.findByText("현재 참가 중인 회원을 찾지 못했습니다."),
    ).toBeVisible();
    expect(transferMutate).not.toHaveBeenCalled();
  });

  it("현재 사용자가 방장일 때만 대상 내보내기를 연결한다", async () => {
    const user = userEvent.setup();
    const ownerUser = { ...currentUser, slug: "owner" };
    renderPanel(requester, { currentUser: ownerUser });

    await user.click(screen.getByRole("button", { name: "관리" }));
    await user.click(screen.getByRole("menuitem", { name: "내보내기" }));

    expect(kickReset).toHaveBeenCalledOnce();
    expect(kickMutate).toHaveBeenCalledWith(
      {
        password: "secret",
        slug: "room",
        userSlug: "target-user",
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("현재 사용자가 방장이면 대상에게 방장 위임을 연결한다", async () => {
    const user = userEvent.setup();
    renderPanel(requester, {
      currentUser: { ...currentUser, slug: "owner" },
    });

    await user.click(screen.getByRole("button", { name: "관리" }));
    await user.click(screen.getByRole("menuitem", { name: "방장 위임" }));

    expect(transferReset).toHaveBeenCalledOnce();
    expect(transferMutate).toHaveBeenCalledWith(
      { slug: "room", userSlug: "target-user" },
      expect.objectContaining({ onError: expect.any(Function) }),
    );
    expect(transferMutate.mock.calls.at(-1)?.[1]).not.toHaveProperty(
      "onSuccess",
    );
    expect(screen.queryByText(/방장을 위임했습니다/)).not.toBeInTheDocument();
  });

  it("방장 위임 실패만 2초 동안 표시하고 자동으로 제거한다", () => {
    vi.useFakeTimers();
    renderPanel(requester, {
      currentUser: { ...currentUser, slug: "owner" },
    });

    fireEvent.click(screen.getByRole("button", { name: "관리" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "방장 위임" }));

    const mutationOptions = transferMutate.mock.calls.at(-1)?.[1] as {
      onError: (error: Error) => void;
    };
    act(() => {
      mutationOptions.onError(new Error("방장 위임 요청에 실패했습니다."));
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "방장 위임 요청에 실패했습니다.",
    );

    act(() => {
      vi.advanceTimersByTime(1_999);
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
