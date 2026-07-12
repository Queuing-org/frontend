import { describe, expect, it } from "vitest";
import type { ChatMessage } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import {
  getChatMessageManagementActions,
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
    senderId: 2,
    senderNickname: "대상",
    senderProfileImageUrl: null,
    senderSlug: "target-user",
    sentAt: 1,
    ...overrides,
  };
}

describe("getChatMessageManagementActions", () => {
  it("본인 메시지에는 관리 액션을 제공하지 않는다", () => {
    expect(
      getChatMessageManagementActions(
        message({ senderId: 1, senderNickname: "나", senderSlug: "me" }),
        currentUser,
      ),
    ).toEqual([]);
  });

  it("비로그인 사용자에게는 관리 액션을 제공하지 않는다", () => {
    expect(getChatMessageManagementActions(message({}), null)).toEqual([]);
  });

  it("회원 메시지는 신고와 차단을 모두 제공한다", () => {
    expect(getChatMessageManagementActions(message({}), currentUser)).toEqual([
      "report",
      "block",
    ]);
  });

  it("비회원 메시지는 messageKey가 있을 때 신고만 제공한다", () => {
    expect(
      getChatMessageManagementActions(
        message({ senderId: null, senderSlug: null }),
        currentUser,
      ),
    ).toEqual(["report"]);
  });

  it("구형 메시지는 senderSlug가 있을 때 차단만 제공한다", () => {
    expect(
      getChatMessageManagementActions(
        message({ messageKey: null }),
        currentUser,
      ),
    ).toEqual(["block"]);
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
