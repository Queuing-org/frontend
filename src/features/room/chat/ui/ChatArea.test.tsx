import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import ChatArea from "./ChatArea";

vi.mock("next/image", () => ({
  default: () => <span data-testid="chat-avatar" />,
}));
vi.mock("@/src/features/follow/blocked/ui/BlockUserModal", () => ({
  default: ({ target, onClose }: { target: unknown; onClose: () => void }) =>
    target ? (
      <div role="dialog" aria-label="차단 모달">
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

function renderChat() {
  return render(
    <ChatArea
      currentUser={currentUser}
      hasOlderMessages={false}
      isLoadingOlderMessages={false}
      messages={messages}
      onLoadOlderMessages={vi.fn()}
      roomPassword="secret"
      roomSlug="room-slug"
      scrollToLatestKey={0}
    />,
  );
}

describe("ChatArea 관리 메뉴", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("작성자 유형과 식별자에 맞는 메뉴만 표시하고 한 번에 하나만 연다", async () => {
    const user = userEvent.setup();
    renderChat();

    expect(screen.queryByRole("button", { name: "나 메시지 관리 메뉴" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "식별없음 메시지 관리 메뉴" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "회원 메시지 관리 메뉴" }));
    expect(screen.getByRole("menuitem", { name: "신고" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "차단" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "비회원 메시지 관리 메뉴" }));
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    expect(screen.getByRole("menuitem", { name: "신고" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "차단" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "구형 메시지 관리 메뉴" }));
    expect(screen.queryByRole("menuitem", { name: "신고" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "차단" })).toBeInTheDocument();
  });

  it("Escape, 바깥 클릭, 스크롤로 메뉴를 닫고 Escape는 포커스를 복원한다", async () => {
    const user = userEvent.setup();
    renderChat();
    const trigger = screen.getByRole("button", { name: "회원 메시지 관리 메뉴" });

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
    const memberTrigger = screen.getByRole("button", { name: "회원 메시지 관리 메뉴" });

    await user.click(memberTrigger);
    await user.click(screen.getByRole("menuitem", { name: "신고" }));
    expect(screen.getByRole("dialog", { name: "신고 모달" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "신고 모달 닫기" }));
    await waitFor(() => expect(memberTrigger).toHaveFocus());

    await user.click(memberTrigger);
    await user.click(screen.getByRole("menuitem", { name: "차단" }));
    expect(screen.getByRole("dialog", { name: "차단 모달" })).toBeInTheDocument();
  });
});
