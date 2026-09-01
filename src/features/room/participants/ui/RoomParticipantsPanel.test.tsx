import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlaylistParticipant } from "@/src/features/playlist/model/types";
import { useKickRoomParticipant } from "@/src/features/room/hooks/useKickRoomParticipant";
import { useTransferRoomOwner } from "@/src/features/room/hooks/useTransferRoomOwner";
import RoomParticipantsPanel from "./RoomParticipantsPanel";

const { notify } = vi.hoisted(() => ({ notify: vi.fn() }));

const kickMutate = vi.fn();
const kickReset = vi.fn();
const transferMutate = vi.fn();
const transferReset = vi.fn();
const onUserBlocked = vi.fn();
const onLoadMore = vi.fn();
const onOpenFriends = vi.fn();
const onOpenSettings = vi.fn();

const member: PlaylistParticipant = {
  nickname: "회원",
  participantId: "participant-member",
  participantType: "USER",
  profileImageUrl: null,
  userSlug: "member",
};

const guest: PlaylistParticipant = {
  nickname: "게스트",
  participantId: "participant-guest",
  participantType: "GUEST",
  profileImageUrl: null,
  userSlug: null,
};

vi.mock("@/src/features/room/hooks/useKickRoomParticipant", () => ({
  useKickRoomParticipant: vi.fn(),
}));
vi.mock("@/src/features/room/hooks/useTransferRoomOwner", () => ({
  useTransferRoomOwner: vi.fn(),
}));
vi.mock("@/src/shared/ui/action-feedback/ActionFeedbackProvider", () => ({
  useActionFeedback: () => ({ notify }),
}));
vi.mock("./RoomParticipantList", () => ({
  default: ({
    onBlockParticipant,
    onKickParticipant,
    onReportParticipant,
    onTransferOwner,
    canModerateParticipants,
  }: {
    onBlockParticipant: (participant: PlaylistParticipant) => void;
    onKickParticipant: (target: PlaylistParticipant) => void;
    onReportParticipant: (participant: PlaylistParticipant) => void;
    onTransferOwner: (participant: PlaylistParticipant) => void;
    canModerateParticipants: boolean;
  }) => (
    <div
      data-testid="participant-list"
      data-can-manage={canModerateParticipants}
    >
      <button type="button" onClick={() => onReportParticipant(member)}>
        회원 신고
      </button>
      <button type="button" onClick={() => onBlockParticipant(member)}>
        회원 차단
      </button>
      <button
        type="button"
        onClick={() => onKickParticipant(member)}
      >
        회원 내보내기
      </button>
      <button
        type="button"
        onClick={() => onKickParticipant(guest)}
      >
        게스트 내보내기
      </button>
      <button type="button" onClick={() => onTransferOwner(member)}>
        회원 방장 위임
      </button>
    </div>
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
      <button type="button" onClick={() => onBlocked?.(target)}>
        차단 확인
      </button>
    ) : null,
}));
vi.mock("@/src/features/room/chat/ui/ReportChatMessageModal", () => ({
  default: ({ target }: { target: { messageKey: string } | null }) =>
    target ? <div role="dialog">{target.messageKey}</div> : null,
}));

function renderPanel(messages = [
  {
    content: "첫 메시지",
    messageId: 1,
    messageKey: "message-old",
    messageType: "TEXT",
    senderNickname: "회원",
    senderProfileImageUrl: null,
    senderSlug: "member",
    sentAt: 1,
  },
  {
    content: "최신 메시지",
    messageId: 2,
    messageKey: "message-latest",
    messageType: "TEXT",
    senderNickname: "회원",
    senderProfileImageUrl: null,
    senderSlug: "member",
    sentAt: 2,
  },
]) {
  return render(
    <RoomParticipantsPanel
      chatMessages={messages}
      currentUser={{
        nickname: "방장",
        profileImageUrl: null,
        slug: "owner",
        userId: 1,
      }}
      hasNextPage
      isFetchingNextPage={false}
      isLoadMoreError={false}
      onLoadMore={onLoadMore}
      onOpenFriends={onOpenFriends}
      onOpenSettings={onOpenSettings}
      onUserBlocked={onUserBlocked}
      participants={[member]}
      roomMeta={{
        activeUsersCount: 2,
        hasPassword: false,
        isPublic: true,
        owner: { nickname: "방장", profileImageUrl: null, slug: "owner" },
        slug: "room",
        tags: [],
        title: "방",
      }}
      roomAccessToken="secret"
      roomSlug="room"
    />,
  );
}

describe("RoomParticipantsPanel", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useKickRoomParticipant).mockReturnValue({
      error: null,
      isError: false,
      isPending: false,
      mutate: kickMutate,
      reset: kickReset,
      variables: undefined,
    } as unknown as ReturnType<typeof useKickRoomParticipant>);
    vi.mocked(useTransferRoomOwner).mockReturnValue({
      error: null,
      isError: false,
      isPending: false,
      mutate: transferMutate,
      reset: transferReset,
      variables: undefined,
    } as unknown as ReturnType<typeof useTransferRoomOwner>);
  });

  it("최신 신고 가능한 채팅을 신고 modal에 연결한다", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: "회원 신고" }));

    expect(screen.getByRole("dialog")).toHaveTextContent("message-latest");
  });

  it("전체 인원은 room meta로 표시하고 다음 page는 명시적으로 요청한다", async () => {
    const user = userEvent.setup();
    renderPanel();

    expect(screen.getByText("2 명")).toBeVisible();
    expect(screen.queryByText("1 명")).toBeNull();

    await user.click(screen.getByRole("button", { name: "참가자 더보기" }));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("신고할 채팅이 없으면 공통 안내를 표시한다", async () => {
    const user = userEvent.setup();
    renderPanel([]);

    await user.click(screen.getByRole("button", { name: "회원 신고" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(
      screen.queryByText("신고할 수 있는 채팅 메시지가 없습니다."),
    ).toBeNull();
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({
      message: "신고할 수 있는 채팅 메시지가 없습니다.",
      tone: "default",
    }));
  });

  it("차단, 내보내기, 방장 위임을 기존 계약에 맞춰 연결한다", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: "회원 차단" }));
    await user.click(screen.getByRole("button", { name: "차단 확인" }));
    expect(onUserBlocked).toHaveBeenCalledWith("member");

    await user.click(screen.getByRole("button", { name: "회원 내보내기" }));
    expect(kickMutate).toHaveBeenCalledWith(
      {
        accessToken: "secret",
        slug: "room",
        userSlug: "member",
      },
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      }),
    );

    await user.click(screen.getByRole("button", { name: "회원 방장 위임" }));
    const transferOptions = transferMutate.mock.calls.at(-1)?.[1];
    expect(transferMutate).toHaveBeenCalledWith(
      { accessToken: "secret", slug: "room", userSlug: "member" },
      expect.objectContaining({ onError: expect.any(Function) }),
    );
    expect(transferOptions).toHaveProperty("onSuccess");
    expect(screen.queryByText(/방장을 위임했습니다/)).not.toBeInTheDocument();
  });

  it("방장 위임 실패를 공통 오류 알림으로 표시한다", () => {
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "회원 방장 위임" }));
    const transferOptions = transferMutate.mock.calls.at(-1)?.[1] as {
      onError: (error: Error) => void;
    };
    act(() => transferOptions.onError(new Error("위임 실패")));
    expect(notify).toHaveBeenCalledWith({
      dedupeKey: "room-member:transfer:room:member",
      message: "위임 실패",
      tone: "error",
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("게스트 내보내기는 participantId target과 같은 feedback key를 사용한다", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: "게스트 내보내기" }));

    expect(kickMutate).toHaveBeenCalledWith(
      {
        participantId: "participant-guest",
        accessToken: "secret",
        slug: "room",
      },
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      }),
    );

    const options = kickMutate.mock.calls.at(-1)?.[1] as {
      onSuccess: () => void;
    };
    act(() => options.onSuccess());
    expect(notify).toHaveBeenCalledWith({
      dedupeKey: "room-member:kick:room:participant-guest",
      message: "'게스트'님을 방에서 내보냈습니다.",
      tone: "default",
    });
  });
});
