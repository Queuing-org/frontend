import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import type { BlockUserTarget } from "@/src/features/follow/blocked/ui/BlockUserModal";
import { useFollowingRelationship } from "@/src/features/follow/following/hooks/useFollowingRelationship";
import { useKickRoomParticipant } from "@/src/features/room/hooks/useKickRoomParticipant";
import { useTransferRoomOwner } from "@/src/features/room/hooks/useTransferRoomOwner";
import ChatArea from "./ChatArea";

vi.mock("next/image", () => ({
  default: () => <span data-testid="chat-avatar" />,
}));
vi.mock("@/src/features/follow/following/hooks/useFollowingRelationship", () => ({
  useFollowingRelationship: vi.fn(),
}));
vi.mock("@/src/features/follow/follow/ui/FollowToggleButton", () => ({
  default: ({
    initialRelationship,
    role,
  }: {
    initialRelationship?: string;
    role?: "menuitem";
  }) => (
    <button type="button" role={role}>
      {initialRelationship === "FOLLOWING" ? "언팔로우" : "팔로우"}
    </button>
  ),
}));
vi.mock("@/src/features/room/hooks/useKickRoomParticipant", () => ({
  useKickRoomParticipant: vi.fn(),
}));
vi.mock("@/src/features/room/hooks/useTransferRoomOwner", () => ({
  useTransferRoomOwner: vi.fn(),
}));
vi.mock("@/src/features/follow/blocked/ui/BlockUserModal", () => ({
  default: ({
    target,
    onBlocked,
    onClose,
  }: {
    target: BlockUserTarget | null;
    onBlocked?: (target: BlockUserTarget) => void;
    onClose: () => void;
  }) =>
    target ? (
      <div role="dialog" aria-label="차단 모달">
        <button type="button" onClick={() => onBlocked?.(target)}>차단 실행</button>
        <button type="button" onClick={onClose}>차단 모달 닫기</button>
      </div>
    ) : null,
}));
vi.mock("./ReportChatMessageModal", () => ({
  default: ({ target, onClose }: { target: unknown; onClose: () => void }) =>
    target ? (
      <div role="dialog" aria-label="신고 모달">
        <button type="button" onClick={onClose}>신고 모달 닫기</button>
      </div>
    ) : null,
}));

const currentUser: User = {
  nickname: "나",
  profileImageUrl: null,
  slug: "me",
  userId: 1,
};

function message(
  nickname: string,
  overrides: Partial<ChatMessage>,
): ChatMessage {
  return {
    content: `${nickname}의 메시지`,
    messageId: null,
    messageKey: `${nickname}-key`,
    messageType: "TEXT",
    senderNickname: nickname,
    senderProfileImageUrl: null,
    senderSlug: `${nickname}-slug`,
    sentAt: 1,
    ...overrides,
  };
}

const messages = [
  message("본인", { senderNickname: "나", senderSlug: "me" }),
  message("회원", {}),
  message("비회원", { senderSlug: null }),
  message("구형", { messageKey: null }),
  message("식별없음", { messageKey: null, senderSlug: null }),
];

const onUserBlocked = vi.fn();
const kickMutate = vi.fn();
const transferMutate = vi.fn();
const resolveParticipantByUserSlug = vi.fn();

const participants = [
  {
    nickname: "회원",
    participantId: "participant-member",
    participantType: "USER" as const,
    profileImageUrl: null,
    userSlug: "회원-slug",
  },
];

function ChatAreaHarness({
  chatMessages,
  hasUnloadedParticipants = false,
  isOwner = false,
  participantItems = participants,
}: {
  chatMessages: ChatMessage[];
  hasUnloadedParticipants?: boolean;
  isOwner?: boolean;
  participantItems?: typeof participants;
}) {
  const [blockedSenderSlugs, setBlockedSenderSlugs] = useState<
    ReadonlySet<string>
  >(new Set());

  return (
    <ChatArea
      blockedSenderSlugs={blockedSenderSlugs}
      currentUser={currentUser}
      hasUnloadedParticipants={hasUnloadedParticipants}
      hasOlderMessages={false}
      isLoadingOlderMessages={false}
      messages={chatMessages}
      onLoadOlderMessages={vi.fn()}
      onUserBlocked={(userSlug) => {
        onUserBlocked(userSlug);
        setBlockedSenderSlugs((current) => {
          const next = new Set(current);
          next.add(userSlug);
          return next;
        });
      }}
      participants={participantItems}
      resolveParticipantByUserSlug={resolveParticipantByUserSlug}
      roomMeta={{
        activeUsersCount: 2,
        hasPassword: false,
        isPublic: true,
        owner: {
          nickname: "방장",
          profileImageUrl: null,
          slug: isOwner ? "me" : "owner",
        },
        slug: "room-slug",
        tags: [],
        title: "방",
      }}
      roomPassword="secret"
      roomSlug="room-slug"
      scrollToLatestKey={0}
    />
  );
}

function renderChat(
  chatMessages = messages,
  isOwner = false,
  options?: {
    hasUnloadedParticipants?: boolean;
    participantItems?: typeof participants;
  },
) {
  return render(
    <ChatAreaHarness
      chatMessages={chatMessages}
      hasUnloadedParticipants={options?.hasUnloadedParticipants}
      isOwner={isOwner}
      participantItems={options?.participantItems}
    />,
  );
}

function getMenuTrigger(nickname: string) {
  return screen.getByRole("button", {
    name: new RegExp(`^${nickname} 메시지\\(.+\\) 관리 메뉴$`),
  });
}

describe("ChatArea 관리 메뉴", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    resolveParticipantByUserSlug.mockResolvedValue(null);
    vi.mocked(useFollowingRelationship).mockReturnValue({
      data: false,
      isLoading: false,
    } as ReturnType<typeof useFollowingRelationship>);
    vi.mocked(useKickRoomParticipant).mockReturnValue({
      error: null,
      isPending: false,
      mutate: kickMutate,
      reset: vi.fn(),
      variables: undefined,
    } as unknown as ReturnType<typeof useKickRoomParticipant>);
    vi.mocked(useTransferRoomOwner).mockReturnValue({
      error: null,
      isPending: false,
      mutate: transferMutate,
      reset: vi.fn(),
      variables: undefined,
    } as unknown as ReturnType<typeof useTransferRoomOwner>);
  });

  it("작성자 유형과 식별자에 맞는 메뉴만 표시하고 한 번에 하나만 연다", async () => {
    const user = userEvent.setup();
    renderChat();

    expect(screen.getByLabelText("채팅 메시지 목록")).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.queryByRole("button", { name: /나 메시지.*관리 메뉴/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /식별없음 메시지.*관리 메뉴/ })).not.toBeInTheDocument();

    await user.click(getMenuTrigger("회원"));
    expect(
      getMenuTrigger("회원").closest("[data-chat-message-key]"),
    ).toHaveAttribute("data-menu-open", "true");
    expect(screen.getByRole("menuitem", { name: "팔로우" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "신고" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "차단" })).toBeInTheDocument();

    await user.click(getMenuTrigger("비회원"));
    expect(
      getMenuTrigger("회원").closest("[data-chat-message-key]"),
    ).not.toHaveAttribute("data-menu-open");
    expect(
      getMenuTrigger("비회원").closest("[data-chat-message-key]"),
    ).toHaveAttribute("data-menu-open", "true");
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    expect(screen.getByRole("menuitem", { name: "신고" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "차단" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "팔로우" })).not.toBeInTheDocument();

    await user.click(getMenuTrigger("구형"));
    expect(screen.queryByRole("menuitem", { name: "신고" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "차단" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "팔로우" })).toBeInTheDocument();
  });

  it("방장은 현재 참여 중인 회원 채팅에서 내보내기와 방장 위임을 실행한다", async () => {
    const user = userEvent.setup();
    renderChat(messages, true);

    await user.click(getMenuTrigger("회원"));
    await user.click(screen.getByRole("menuitem", { name: "내보내기" }));
    expect(kickMutate).toHaveBeenCalledWith(
      {
        password: "secret",
        slug: "room-slug",
        userSlug: "회원-slug",
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );

    await user.click(getMenuTrigger("회원"));
    await user.click(screen.getByRole("menuitem", { name: "방장 위임" }));
    const transferOptions = transferMutate.mock.calls.at(-1)?.[1];
    expect(transferMutate).toHaveBeenCalledWith(
      { slug: "room-slug", userSlug: "회원-slug" },
      expect.objectContaining({ onError: expect.any(Function) }),
    );
    expect(transferOptions).not.toHaveProperty("onSuccess");
    expect(screen.queryByText(/방장을 위임했습니다/)).not.toBeInTheDocument();
  });

  it("미로드 page 후보는 관리 메뉴를 유지하고 실행 시에만 참가 여부를 resolve한다", async () => {
    const user = userEvent.setup();
    resolveParticipantByUserSlug.mockResolvedValue(participants[0]);
    renderChat(messages, true, {
      hasUnloadedParticipants: true,
      participantItems: [],
    });

    await user.click(getMenuTrigger("회원"));
    expect(screen.getByRole("menuitem", { name: "내보내기" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "방장 위임" })).toBeVisible();
    expect(resolveParticipantByUserSlug).not.toHaveBeenCalled();

    await user.click(screen.getByRole("menuitem", { name: "내보내기" }));

    await waitFor(() =>
      expect(resolveParticipantByUserSlug).toHaveBeenCalledWith("회원-slug"),
    );
    expect(kickMutate).toHaveBeenCalledWith(
      {
        password: "secret",
        slug: "room-slug",
        userSlug: "회원-slug",
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("cursor를 끝까지 탐색해도 참가자가 없으면 mutation을 막고 오류를 표시한다", async () => {
    const user = userEvent.setup();
    renderChat(messages, true, {
      hasUnloadedParticipants: true,
      participantItems: [],
    });

    await user.click(getMenuTrigger("회원"));
    await user.click(screen.getByRole("menuitem", { name: "방장 위임" }));

    expect(
      await screen.findByText("현재 참가 중인 회원을 찾지 못했습니다."),
    ).toBeVisible();
    expect(transferMutate).not.toHaveBeenCalled();
  });

  it("방장 위임 실패 안내를 2초 뒤 제거한다", () => {
    vi.useFakeTimers();
    renderChat(messages, true);

    fireEvent.click(getMenuTrigger("회원"));
    fireEvent.click(screen.getByRole("menuitem", { name: "방장 위임" }));
    const transferOptions = transferMutate.mock.calls.at(-1)?.[1] as {
      onError: (error: Error) => void;
    };
    act(() => transferOptions.onError(new Error("위임 실패")));
    expect(screen.getByRole("alert")).toHaveTextContent("위임 실패");

    act(() => vi.advanceTimersByTime(2_000));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("Escape, 바깥 클릭, 스크롤로 메뉴를 닫고 Escape는 포커스를 복원한다", async () => {
    const user = userEvent.setup();
    renderChat();
    const trigger = getMenuTrigger("회원");

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);
    fireEvent.scroll(screen.getByLabelText("채팅 메시지 목록"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("신고·차단 메뉴를 모달에 연결하고 닫은 뒤 트리거 포커스를 복원한다", async () => {
    const user = userEvent.setup();
    renderChat();
    const memberTrigger = getMenuTrigger("회원");

    await user.click(memberTrigger);
    await user.click(screen.getByRole("menuitem", { name: "신고" }));
    expect(screen.getByRole("dialog", { name: "신고 모달" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "신고 모달 닫기" }));
    await waitFor(() => expect(memberTrigger).toHaveFocus());

    await user.click(memberTrigger);
    await user.click(screen.getByRole("menuitem", { name: "차단" }));
    expect(screen.getByRole("dialog", { name: "차단 모달" })).toBeInTheDocument();
  });

  it("차단 성공 즉시 해당 사용자의 기존 채팅을 숨긴다", async () => {
    const user = userEvent.setup();
    renderChat();

    await user.click(getMenuTrigger("회원"));
    await user.click(screen.getByRole("menuitem", { name: "차단" }));
    await user.click(screen.getByRole("button", { name: "차단 실행" }));

    expect(onUserBlocked).toHaveBeenCalledWith("회원-slug");
    expect(screen.queryByText("회원의 메시지")).not.toBeInTheDocument();
    expect(screen.getByText("비회원의 메시지")).toBeInTheDocument();
  });

  it("새로고침 후 전달된 차단 안내 메시지를 렌더링하지 않는다", () => {
    renderChat([
      message("차단안내", { content: "차단된 사용자의 채팅입니다" }),
      message("일반", {}),
    ]);

    expect(screen.queryByText("차단된 사용자의 채팅입니다")).not.toBeInTheDocument();
    expect(screen.getByText("일반의 메시지")).toBeInTheDocument();
  });

  it("하단 공간이 부족하면 관리 메뉴를 위로 연다", async () => {
    const user = userEvent.setup();
    renderChat();
    const list = screen.getByLabelText("채팅 메시지 목록");
    const trigger = getMenuTrigger("회원");
    vi.spyOn(list, "getBoundingClientRect").mockReturnValue({
      bottom: 400,
      height: 400,
      left: 0,
      right: 400,
      top: 0,
      width: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
      bottom: 390,
      height: 28,
      left: 350,
      right: 378,
      top: 362,
      width: 28,
      x: 350,
      y: 362,
      toJSON: () => ({}),
    });

    await user.click(trigger);

    expect(screen.getByRole("menu")).toHaveAttribute("data-placement", "up");
  });
});
