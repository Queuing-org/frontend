import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { subscribeFollowPresence } from "../api/subscribeFollowPresence";
import { useFollowPresenceSubscription } from "./useFollowPresenceSubscription";

const socket = vi.hoisted(() => ({
  listener: null as {
    onConnect?: () => void;
  } | null,
}));

vi.mock("@/src/features/user/session/hooks/useMe", () => ({
  useMe: vi.fn(),
}));
vi.mock("@/src/shared/api/websocket/stompConnection", () => ({
  addSocketListener: vi.fn((listener) => {
    socket.listener = listener;
    return vi.fn();
  }),
  connectSocket: vi.fn(),
  getSocketClient: vi.fn(() => ({ connected: false })),
}));
vi.mock("../api/subscribeFollowPresence", () => ({
  subscribeFollowPresence: vi.fn(),
}));

describe("follow presence STOMP 재구독", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socket.listener = null;
    vi.mocked(useMe).mockReturnValue({
      data: {
        nickname: "나",
        profileImageUrl: null,
        slug: "me",
      },
    } as ReturnType<typeof useMe>);
  });

  it("재연결할 때 이전 구독을 해제하고 하나만 복구한다", async () => {
    const firstUnsubscribe = vi.fn();
    const secondUnsubscribe = vi.fn();
    vi.mocked(subscribeFollowPresence)
      .mockReturnValueOnce({
        unsubscribe: firstUnsubscribe,
      } as ReturnType<typeof subscribeFollowPresence>)
      .mockReturnValueOnce({
        unsubscribe: secondUnsubscribe,
      } as ReturnType<typeof subscribeFollowPresence>);
    const queryClient = new QueryClient();
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { unmount } = renderHook(() => useFollowPresenceSubscription(), {
      wrapper,
    });
    await waitFor(() => expect(socket.listener).not.toBeNull());

    socket.listener?.onConnect?.();
    socket.listener?.onConnect?.();

    expect(subscribeFollowPresence).toHaveBeenCalledTimes(2);
    expect(firstUnsubscribe).toHaveBeenCalledOnce();
    expect(secondUnsubscribe).not.toHaveBeenCalled();

    unmount();
    expect(secondUnsubscribe).toHaveBeenCalledOnce();
  });
});
