import { act, render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchRoomMeta } from "@/src/features/room/api/fetchRoomMeta";
import { joinRoom } from "@/src/features/room/api/joinRoom";
import { roomKeys } from "@/src/features/room/model/queryKeys";
import { useRoomPlayback } from "@/src/features/playlist/model/useRoomPlayback";
import { useRoomParticipants } from "@/src/features/playlist/model/useRoomParticipants";
import RoomPlaybackScreen from "./RoomPlaybackScreen";

const mocks = vi.hoisted(() => {
  const refetchRoomPlayback = vi.fn();
  const refetchParticipants = vi.fn();
  const ensureRoomSubscription = vi.fn();
  const leaveRoomSession = vi.fn();
  const roomChat = {
    cleanupSubscriptions: vi.fn(),
    initializeFromJoinData: vi.fn(),
    reset: vi.fn(),
  };

  return {
    ensureRoomSubscription,
    leaveRoomSession,
    refetchParticipants,
    refetchRoomPlayback,
    roomChat,
  };
});

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "room" }),
}));
vi.mock("@/src/shared/lib/useMediaQuery", () => ({
  useMediaQuery: () => false,
}));
vi.mock("@/src/features/room/api/fetchRoomMeta", () => ({
  fetchRoomMeta: vi.fn(),
}));
vi.mock("@/src/features/room/api/joinRoom", () => ({
  joinRoom: vi.fn(),
}));
vi.mock("@/src/features/playlist/model/useRoomPlayback", () => ({
  useRoomPlayback: vi.fn(() => ({
    data: undefined,
    error: null,
    isError: false,
    isLoading: true,
    refetch: mocks.refetchRoomPlayback,
  })),
}));
vi.mock("@/src/features/playlist/model/useRoomParticipants", () => ({
  useRoomParticipants: vi.fn(() => ({
    data: undefined,
    error: null,
    isError: false,
    isLoading: true,
    refetch: mocks.refetchParticipants,
  })),
}));
vi.mock("@/src/features/user/session/hooks/useMe", () => ({
  useMe: () => ({ data: null, isLoading: false }),
}));
vi.mock("@/src/features/room/chat/hooks/useRoomChat", () => ({
  useRoomChat: () => mocks.roomChat,
}));
vi.mock("../hooks/useRoomRealtimeEvents", () => ({
  useRoomRealtimeEvents: () => ({
    ensureRoomSubscription: mocks.ensureRoomSubscription,
    leaveRoomSession: mocks.leaveRoomSession,
  }),
}));
vi.mock("@/src/features/room/floating/model/useFloatingWidgetsState", () => ({
  useFloatingWidgetsState: () => ({}),
}));

describe("RoomPlaybackScreen join reads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("pre-join meta를 query cache에 저장하고 joined 전환 시 warm read를 수동 refetch하지 않는다", async () => {
    const roomMeta = {
      slug: "room",
      title: "방",
      isPublic: true,
      hasPassword: false,
      activeUsersCount: 1,
      tags: [],
    };
    vi.mocked(fetchRoomMeta).mockResolvedValue(roomMeta);
    vi.mocked(joinRoom).mockResolvedValue({
      roomSlug: "room",
      timestamp: 1,
      data: null,
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <RoomPlaybackScreen />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(joinRoom).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(useRoomPlayback).toHaveBeenCalledWith("room", null, true),
    );
    expect(useRoomParticipants).toHaveBeenCalledWith("room", null, true);
    expect(fetchRoomMeta).toHaveBeenCalledTimes(1);
    expect(fetchRoomMeta).toHaveBeenCalledWith(
      "room",
      expect.any(AbortSignal),
    );
    expect(queryClient.getQueryData(roomKeys.meta("room"))).toEqual(roomMeta);
    expect(mocks.refetchRoomPlayback).not.toHaveBeenCalled();
    expect(mocks.refetchParticipants).not.toHaveBeenCalled();

    unmount();
    expect(mocks.leaveRoomSession).toHaveBeenCalledOnce();
  });

  it("StrictMode 재실행이 공유 meta 요청을 취소하거나 입장을 실패시키지 않는다", async () => {
    const roomMeta = {
      slug: "room",
      title: "방",
      isPublic: true,
      hasPassword: false,
      activeUsersCount: 1,
      tags: [],
    };
    let resolveRoomMeta!: (value: typeof roomMeta) => void;
    vi.mocked(fetchRoomMeta).mockReturnValue(
      new Promise((resolve) => {
        resolveRoomMeta = resolve;
      }),
    );
    vi.mocked(joinRoom).mockResolvedValue({
      roomSlug: "room",
      timestamp: 1,
      data: null,
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { unmount } = render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <RoomPlaybackScreen />
        </QueryClientProvider>
      </StrictMode>,
    );

    await waitFor(() => expect(fetchRoomMeta).toHaveBeenCalledTimes(1));
    const sharedQuerySignal = vi.mocked(fetchRoomMeta).mock.calls[0]?.[1];
    expect(sharedQuerySignal?.aborted).toBe(false);

    await act(async () => resolveRoomMeta(roomMeta));

    await waitFor(() => expect(joinRoom).toHaveBeenCalledTimes(1));
    expect(sharedQuerySignal?.aborted).toBe(false);

    unmount();
  });
});
