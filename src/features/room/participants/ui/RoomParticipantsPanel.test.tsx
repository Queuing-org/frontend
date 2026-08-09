import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlaylistParticipant } from "@/src/features/playlist/model/types";
import { useKickRoomParticipant } from "@/src/features/room/hooks/useKickRoomParticipant";
import { useTransferRoomOwner } from "@/src/features/room/hooks/useTransferRoomOwner";
import RoomParticipantsPanel from "./RoomParticipantsPanel";

const kickMutate = vi.fn();
const kickReset = vi.fn();
const transferMutate = vi.fn();
const transferReset = vi.fn();
const onUserBlocked = vi.fn();

const member: PlaylistParticipant = {
  nickname: "회원",
  participantId: "participant-member",
  participantType: "USER",
  profileImageUrl: null,
  userSlug: "member",
};

vi.mock("@/src/features/room/hooks/useKickRoomParticipant", () => ({
  useKickRoomParticipant: vi.fn(),
}));
vi.mock("@/src/features/room/hooks/useTransferRoomOwner", () => ({
  useTransferRoomOwner: vi.fn(),
}));
vi.mock("./RoomParticipantList", () => ({
  default: ({
    onBlockParticipant,
    onKickParticipant,
    onReportParticipant,
    onTransferOwner,
    showParticipantActions,
  }: {
    onBlockParticipant: (participant: PlaylistParticipant) => void;
    onKickParticipant: (target: { userSlug: string }) => void;
    onReportParticipant: (participant: PlaylistParticipant) => void;
    onTransferOwner: (participant: PlaylistParticipant) => void;
    showParticipantActions: boolean;
  }) => (
    <div data-testid="participant-list" data-can-manage={showParticipantActions}>
      <button type="button" onClick={() => onReportParticipant(member)}>
        회원 신고
      </button>
      <button type="button" onClick={() => onBlockParticipant(member)}>
        회원 차단
      </button>
      <button
        type="button"
        onClick={() => onKickParticipant({ userSlug: "member" })}
      >
        회원 내보내기
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
      roomPassword="secret"
      roomSlug="room"
    />,
  );
}

describe("RoomParticipantsPanel", () => {
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

  it("신고할 채팅이 없으면 요청 target 대신 안내를 표시한다", async () => {
    const user = userEvent.setup();
    renderPanel([]);

    await user.click(screen.getByRole("button", { name: "회원 신고" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      screen.getByText("신고할 수 있는 채팅 메시지가 없습니다."),
    ).toBeVisible();
  });

  it("차단, 내보내기, 방장 위임을 기존 계약에 맞춰 연결한다", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: "회원 차단" }));
    await user.click(screen.getByRole("button", { name: "차단 확인" }));
    expect(onUserBlocked).toHaveBeenCalledWith("member");

    await user.click(screen.getByRole("button", { name: "회원 내보내기" }));
    expect(kickMutate).toHaveBeenCalledWith({
      password: "secret",
      slug: "room",
      userSlug: "member",
    });

    await user.click(screen.getByRole("button", { name: "회원 방장 위임" }));
    expect(transferMutate).toHaveBeenCalledWith(
      { slug: "room", userSlug: "member" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});
