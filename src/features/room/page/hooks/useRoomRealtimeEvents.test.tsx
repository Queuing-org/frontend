import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { subscribeRoomEvents } from "@/src/features/room/api/websocket/subscribeRoomEvents";
import { addSocketListener } from "@/src/shared/api/websocket/stompConnection";
import { useRoomRealtimeEvents } from "./useRoomRealtimeEvents";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/src/features/room/api/websocket/subscribeRoomEvents", () => ({
  subscribeRoomEvents: vi.fn(),
}));
vi.mock("@/src/shared/api/websocket/stompConnection", () => ({
  addSocketListener: vi.fn(),
}));

describe("useRoomRealtimeEvents 재연결", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("반복 연결 시 이전 구독을 해제하고 방 조회를 다시 검증한다", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const removeSocketListener = vi.fn();
    let socketListener:
      | Parameters<typeof addSocketListener>[0]
      | undefined;
    vi.mocked(addSocketListener).mockImplementation((listener) => {
      socketListener = listener;
      return removeSocketListener;
    });

    const subscriptions = Array.from({ length: 3 }, () => ({
      id: crypto.randomUUID(),
      unsubscribe: vi.fn(),
    }));
    vi.mocked(subscribeRoomEvents)
      .mockReturnValueOnce(subscriptions[0])
      .mockReturnValueOnce(subscriptions[1])
      .mockReturnValueOnce(subscriptions[2]);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const cleanupChatSubscriptions = vi.fn();
    const resetChatState = vi.fn();
    const setJoinErrorMessage = vi.fn();
    const setLivePlaybackStatus = vi.fn();
    const setStatus = vi.fn();
    const { result, unmount } = renderHook(
      () =>
        useRoomRealtimeEvents({
          cleanupChatSubscriptions,
          resetChatState,
          setJoinErrorMessage,
          setLivePlaybackStatus,
          setStatus,
          slug: "room",
        }),
      { wrapper },
    );

    await waitFor(() => expect(socketListener).toBeDefined());

    act(() => {
      result.current.ensureRoomSubscription("room", "secret");
    });
    expect(subscribeRoomEvents).toHaveBeenCalledTimes(1);

    act(() => {
      socketListener?.onConnect?.({} as never);
    });
    expect(subscriptions[0].unsubscribe).toHaveBeenCalledTimes(1);
    expect(subscribeRoomEvents).toHaveBeenCalledTimes(2);

    act(() => {
      socketListener?.onConnect?.({} as never);
    });
    expect(subscriptions[1].unsubscribe).toHaveBeenCalledTimes(1);
    expect(subscriptions[2].unsubscribe).not.toHaveBeenCalled();
    expect(subscribeRoomEvents).toHaveBeenCalledTimes(3);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["roomPlayback", "room"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["roomParticipants", "room"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["roomQueue", "room"],
    });

    act(() => {
      result.current.cleanupRoomSubscription();
    });
    expect(subscriptions[2].unsubscribe).toHaveBeenCalledTimes(1);

    unmount();
    expect(removeSocketListener).toHaveBeenCalledTimes(1);
  });
});
