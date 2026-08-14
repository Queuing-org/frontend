import { describe, expect, it } from "vitest";
import type { ChatMessage } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import {
  appendUniqueChatMessage,
  applyChatMessageTombstones,
  createChatMessageIdentityIndex,
  getChatMessageManagementActions,
  getLatestReportableChatMessageKey,
  getVisibleChatMessageWindow,
  shouldDisplayChatMessage,
} from "./chatMessages";

const currentUser: User = {
  nickname: "나",
  profileImageUrl: null,
  slug: "me",
  userId: 1,
};

function message(overrides: Partial<ChatMessage>): ChatMessage {
  return {
    content: "내용",
    messageId: 1,
    messageKey: "message-key",
    messageType: "TEXT",
    senderNickname: "대상",
    senderProfileImageUrl: null,
    senderSlug: "target-user",
    sentAt: 1,
    ...overrides,
  };
}

describe("getChatMessageManagementActions", () => {
  it("삭제 tombstone 메시지는 신고를 포함한 관리 액션에서 제외한다", () => {
    expect(getChatMessageManagementActions(message({ isDeleted: true }), currentUser)).toEqual([]);
  });
  it("본인 메시지에는 관리 액션을 제공하지 않는다", () => {
    expect(
      getChatMessageManagementActions(
        message({ senderNickname: "나", senderSlug: "me" }),
        currentUser,
      ),
    ).toEqual([]);
  });

  it("비로그인 사용자에게는 관리 액션을 제공하지 않는다", () => {
    expect(getChatMessageManagementActions(message({}), null)).toEqual([]);
  });

  it("회원 메시지는 팔로우, 신고와 차단을 제공한다", () => {
    expect(getChatMessageManagementActions(message({}), currentUser)).toEqual([
      "follow",
      "report",
      "block",
    ]);
  });

  it("비회원 메시지는 messageKey가 있을 때 신고만 제공한다", () => {
    expect(
      getChatMessageManagementActions(
        message({ senderSlug: null }),
        currentUser,
      ),
    ).toEqual(["report"]);
  });

  it("구형 회원 메시지는 팔로우와 차단을 제공한다", () => {
    expect(
      getChatMessageManagementActions(
        message({ messageKey: null }),
        currentUser,
      ),
    ).toEqual(["follow", "block"]);
  });

  it("현재 방장이 참여 중인 회원을 관리하면 내보내기와 방장 위임을 추가한다", () => {
    expect(
      getChatMessageManagementActions(message({}), currentUser, {
        canKick: true,
        canTransfer: true,
      }),
    ).toEqual(["follow", "report", "block", "kick", "transfer"]);
  });

  it("게스트 메시지에는 방장 옵션이 와도 회원 전용 액션을 추가하지 않는다", () => {
    expect(
      getChatMessageManagementActions(
        message({ senderSlug: null }),
        currentUser,
        { canKick: true, canTransfer: true },
      ),
    ).toEqual(["report"]);
  });

  it("필요한 식별자가 없으면 관리 액션을 제공하지 않는다", () => {
    expect(
      getChatMessageManagementActions(
        message({ messageKey: null, senderSlug: null }),
        currentUser,
      ),
    ).toEqual([]);
  });
});

describe("shouldDisplayChatMessage", () => {
  it("현재 방에서 차단한 sender slug의 메시지를 숨긴다", () => {
    expect(
      shouldDisplayChatMessage(message({ senderSlug: "target-user" }), new Set(["target-user"])),
    ).toBe(false);
  });

  it("서버가 반환한 차단 안내 메시지를 숨긴다", () => {
    expect(
      shouldDisplayChatMessage(
        message({ content: "차단된 사용자의 채팅입니다." }),
        new Set(),
      ),
    ).toBe(false);
  });

  it("차단되지 않은 일반 메시지는 표시한다", () => {
    expect(shouldDisplayChatMessage(message({}), new Set())).toBe(true);
  });
});

describe("getLatestReportableChatMessageKey", () => {
  it("대상 회원의 가장 최근 messageKey를 반환한다", () => {
    expect(
      getLatestReportableChatMessageKey(
        [
          message({ messageKey: "old-key", sentAt: 1 }),
          message({ messageKey: "other-key", senderSlug: "other", sentAt: 2 }),
          message({ messageKey: " latest-key ", sentAt: 3 }),
        ],
        "target-user",
      ),
    ).toBe("latest-key");
  });

  it("대상의 신고 가능한 채팅이 없으면 null을 반환한다", () => {
    expect(
      getLatestReportableChatMessageKey(
        [message({ messageKey: null, senderSlug: "target-user" })],
        "target-user",
      ),
    ).toBeNull();
    expect(getLatestReportableChatMessageKey([message({})], null)).toBeNull();
  });

  it("삭제된 메시지는 최근 신고 대상으로 선택하지 않는다", () => {
    expect(getLatestReportableChatMessageKey([
      message({ messageKey: "live", sentAt: 1 }),
      message({ messageKey: "deleted", sentAt: 2, isDeleted: true }),
    ], "target-user")).toBe("live");
  });
});

describe("chat deletion tombstone", () => {
  it("삭제 이벤트가 메시지보다 먼저 와도 뒤늦은 기록을 서버 문구로 치환한다", () => {
    const result = applyChatMessageTombstones(
      [message({ messageKey: "late", content: "원문" })],
      new Map([["late", "삭제된 채팅입니다."]]),
    );
    expect(result[0]).toMatchObject({ content: "삭제된 채팅입니다.", isDeleted: true });
  });

  it("메시지가 먼저 있어도 tombstone 적용 시 원문을 치환한다", () => {
    const existing = [message({ messageKey: "existing", content: "원문" })];
    expect(applyChatMessageTombstones(existing, new Map([["existing", "서버 삭제 문구"]]))[0])
      .toMatchObject({ content: "서버 삭제 문구", isDeleted: true });
  });
});

describe("chat message identity window", () => {
  it("10k 실시간 이벤트 뒤에도 최근 window만 유지한다", () => {
    let messages: ChatMessage[] = [];
    const index = createChatMessageIdentityIndex(messages);

    for (let messageId = 1; messageId <= 10_000; messageId += 1) {
      messages = appendUniqueChatMessage(
        messages,
        message({ messageId, messageKey: `message-${messageId}` }),
        index,
        500,
      );
    }

    expect(messages).toHaveLength(500);
    expect(messages[0]?.messageId).toBe(9_501);
    expect(messages.at(-1)?.messageId).toBe(10_000);
    expect(index.size).toBe(1_000);
  });

  it("buffer key와 DB id가 순차 도착해도 한 메시지만 증분 갱신한다", () => {
    let messages: ChatMessage[] = [];
    const index = createChatMessageIdentityIndex(messages);

    messages = appendUniqueChatMessage(
      messages,
      message({ messageId: null, messageKey: "buffer-key" }),
      index,
      500,
    );
    messages = appendUniqueChatMessage(
      messages,
      message({ messageId: 77, messageKey: "buffer-key" }),
      index,
      500,
    );
    messages = appendUniqueChatMessage(
      messages,
      message({ content: "DB 반영", messageId: 77, messageKey: null }),
      index,
      500,
    );

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      content: "DB 반영",
      messageId: 77,
      messageKey: "buffer-key",
    });
  });

  it("UI에 전달할 message window도 최근 500개로 제한한다", () => {
    const messages = Array.from({ length: 650 }, (_, index) =>
      message({ messageId: index, messageKey: `message-${index}` }),
    );

    const visibleMessages = getVisibleChatMessageWindow(messages, new Set());

    expect(visibleMessages).toHaveLength(500);
    expect(visibleMessages[0]?.messageId).toBe(150);
    expect(visibleMessages.at(-1)?.messageId).toBe(649);
  });
});
