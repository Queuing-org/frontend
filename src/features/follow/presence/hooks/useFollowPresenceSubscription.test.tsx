import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { subscribeFollowPresence } from "../api/subscribeFollowPresence";
import { useFollowPresenceSubscription } from "./useFollowPresenceSubscription";

const socket = vi.hoisted(() => ({
  client: {
    activate: vi.fn(),
    deactivate: vi.fn(),
    onConnect: undefined as (() => void) | undefined,
  },
}));

vi.mock("@/src/features/user/session/hooks/useMe", () => ({
  useMe: vi.fn(),
}));
vi.mock("@/src/shared/api/websocket/createStompClient", () => ({
  createStompClient: vi.fn(() => socket.client),
}));
vi.mock("../api/subscribeFollowPresence", () => ({
  subscribeFollowPresence: vi.fn(),
}));

describe("follow presence STOMP 재구독", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socket.client.onConnect = undefined;
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
    await waitFor(() => expect(socket.client.activate).toHaveBeenCalledOnce());

    socket.client.onConnect?.();
    socket.client.onConnect?.();

    expect(subscribeFollowPresence).toHaveBeenCalledTimes(2);
    expect(subscribeFollowPresence).toHaveBeenCalledWith(
      socket.client,
      expect.any(Function),
    );
    expect(firstUnsubscribe).toHaveBeenCalledOnce();
    expect(secondUnsubscribe).not.toHaveBeenCalled();

    unmount();
    expect(secondUnsubscribe).toHaveBeenCalledOnce();
    expect(socket.client.deactivate).toHaveBeenCalledOnce();
  });
});
