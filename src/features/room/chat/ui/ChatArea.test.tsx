import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import type { BlockUserTarget } from "@/src/features/follow/blocked/ui/BlockUserModal";
import ChatArea from "./ChatArea";

vi.mock("next/image", () => ({
  default: () => <span data-testid="chat-avatar" />,
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
    senderId: 2,
    senderNickname: nickname,
    senderProfileImageUrl: null,
    senderSlug: `${nickname}-slug`,
    sentAt: 1,
    ...overrides,
  };
}

const messages = [
  message("본인", { senderId: 1, senderNickname: "나", senderSlug: "me" }),
  message("회원", {}),
  message("비회원", { senderId: null, senderSlug: null }),
  message("구형", { messageKey: null }),
  message("식별없음", { messageKey: null, senderId: null, senderSlug: null }),
];

function renderChat(chatMessages = messages) {
  return render(
    <ChatArea
      currentUser={currentUser}
      hasOlderMessages={false}
      isLoadingOlderMessages={false}
      messages={chatMessages}
      onLoadOlderMessages={vi.fn()}
      roomPassword="secret"
      roomSlug="room-slug"
      scrollToLatestKey={0}
    />,
  );
}

function getMenuTrigger(nickname: string) {
  return screen.getByRole("button", {
    name: new RegExp(`^${nickname} 메시지\\(.+\\) 관리 메뉴$`),
  });
}

describe("ChatArea 관리 메뉴", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("작성자 유형과 식별자에 맞는 메뉴만 표시하고 한 번에 하나만 연다", async () => {
    const user = userEvent.setup();
    renderChat();

    expect(screen.queryByRole("button", { name: /나 메시지.*관리 메뉴/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /식별없음 메시지.*관리 메뉴/ })).not.toBeInTheDocument();

    await user.click(getMenuTrigger("회원"));
    expect(screen.getByRole("menuitem", { name: "신고" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "차단" })).toBeInTheDocument();

    await user.click(getMenuTrigger("비회원"));
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    expect(screen.getByRole("menuitem", { name: "신고" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "차단" })).not.toBeInTheDocument();

    await user.click(getMenuTrigger("구형"));
    expect(screen.queryByRole("menuitem", { name: "신고" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "차단" })).toBeInTheDocument();
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
