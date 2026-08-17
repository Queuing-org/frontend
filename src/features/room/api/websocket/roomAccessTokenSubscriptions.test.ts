import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";
import { subscribeRoomChatEvents } from "./subscribeRoomChatEvents";
import { subscribeRoomEvents } from "./subscribeRoomEvents";

vi.mock("@/src/shared/api/websocket/stompConnection", () => ({
  getSocketClient: vi.fn(),
}));

describe("room access token topic subscriptions", () => {
  const subscribe = vi.fn(() => ({ unsubscribe: vi.fn() }));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSocketClient).mockReturnValue({ subscribe } as never);
  });

  it("방 이벤트와 채팅 토픽에 접근 토큰 native header를 붙인다", () => {
    const onMessage = vi.fn();

    subscribeRoomEvents("room", onMessage, "access-token");
    subscribeRoomChatEvents("room", onMessage, "access-token");

    expect(subscribe).toHaveBeenNthCalledWith(
      1,
      "/topic/room/room/events",
      onMessage,
      { "X-Room-Access-Token": "access-token" },
    );
    expect(subscribe).toHaveBeenNthCalledWith(
      2,
      "/topic/room/room/chat",
      onMessage,
      { "X-Room-Access-Token": "access-token" },
    );
  });
});
