import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRoomChats } from "@/src/features/room/hooks/useRoomChats";
import type {
  ChatMessage,
  RoomJoinedData,
} from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import { useRoomChatHistory } from "./useRoomChatHistory";

vi.mock("@/src/features/room/hooks/useRoomChats", () => ({
  useRoomChats: vi.fn(),
}));

const currentUser: User = {
  nickname: "나",
  profileImageUrl: null,
  slug: "me",
};

function createMessage(
  messageId: number,
  overrides: Partial<ChatMessage> = {},
): ChatMessage {
  return {
    content: `메시지 ${messageId}`,
    messageId,
    messageKey: `message-${messageId}`,
    messageType: "TEXT",
    senderNickname: "다른 사용자",
    senderProfileImageUrl: null,
    senderSlug: "other",
    sentAt: messageId,
    ...overrides,
  };
}

function createJoinData(recentChatMessages: ChatMessage[]): RoomJoinedData {
  return {
    participant: {
      nickname: "나",
      participantId: "participant-me",
      participantType: "USER",
      profileImageUrl: null,
      userSlug: "me",
    },
    recentChatMessages,
  };
}

function renderChatHistory() {
  return renderHook(() =>
    useRoomChatHistory({
      currentUser,
      isEnabled: false,
      slug: "room",
    }),
  );
}

describe("useRoomChatHistory pending backfill", () => {
  const loadRoomChats = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRoomChats).mockReturnValue({
      isPending: false,
      mutateAsync: loadRoomChats,
    } as unknown as ReturnType<typeof useRoomChats>);
  });

  it("기존 history보다 오래된 unknown은 버리고 동일 내용의 가장 최신 pending만 뒤에 붙인다", async () => {
    const currentMessages = Array.from({ length: 50 }, (_, index) =>
      createMessage(index + 51),
    );
    const latestPageDescending = Array.from({ length: 100 }, (_, index) => {
      const messageId = 101 - index;
      return createMessage(
        messageId,
        messageId === 101 || messageId === 2
          ? {
              content: "같은 내용",
              senderNickname: "나",
              senderSlug: "me",
            }
          : {},
      );
    });
    loadRoomChats.mockResolvedValue({
      hasNext: true,
      items: latestPageDescending,
      nextCursor: 2,
    });
    const { result } = renderChatHistory();

    act(() => {
      result.current.initializeFromJoinData(createJoinData(currentMessages));
    });

    let foundContents: readonly string[] = [];
    await act(async () => {
      foundContents = await result.current.backfillLatestMessages(["같은 내용"]);
    });

    expect(foundContents).toEqual(["같은 내용"]);
    expect(result.current.messages.map((message) => message.messageId)).toEqual(
      Array.from({ length: 51 }, (_, index) => index + 51),
    );
    expect(result.current.messages.some((message) => message.messageId === 2)).toBe(
      false,
    );
    expect(result.current.scrollToLatestKey).toBe(2);
  });

  it("pending을 찾지 못하면 기존 message 배열과 scroll anchor를 그대로 둔다", async () => {
    const currentMessages = Array.from({ length: 50 }, (_, index) =>
      createMessage(index + 51),
    );
    loadRoomChats.mockResolvedValue({
      hasNext: true,
      items: Array.from({ length: 100 }, (_, index) =>
        createMessage(100 - index),
      ),
      nextCursor: 1,
    });
    const { result } = renderChatHistory();

    act(() => {
      result.current.initializeFromJoinData(createJoinData(currentMessages));
    });
    const messagesBeforeBackfill = result.current.messages;
    const scrollKeyBeforeBackfill = result.current.scrollToLatestKey;

    let foundContents: readonly string[] = [];
    await act(async () => {
      foundContents = await result.current.backfillLatestMessages(["미반영 메시지"]);
    });

    expect(foundContents).toEqual([]);
    expect(result.current.messages).toBe(messagesBeforeBackfill);
    expect(result.current.scrollToLatestKey).toBe(scrollKeyBeforeBackfill);
  });
});
