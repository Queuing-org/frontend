import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchRoomMeta } from "@/src/features/room/api/fetchRoomMeta";
import { joinRoom } from "@/src/features/room/api/joinRoom";
import { roomKeys } from "@/src/features/room/model/queryKeys";
import { useRoomPlayback } from "@/src/features/playlist/model/useRoomPlayback";
import { useRoomParticipants } from "@/src/features/playlist/model/useRoomParticipants";
import { ApiError } from "@/src/shared/api/api-error";
import { RoomJoinError } from "@/src/features/room/api/joinRoom.types";
import { storeRoomJoinHandoff } from "@/src/features/room/join/model/roomJoinHandoff";
import RoomPlaybackScreen from "./RoomPlaybackScreen";

const mocks = vi.hoisted(() => {
  const refetchRoomPlayback = vi.fn();
  const refetchParticipants = vi.fn();
  const ensureRoomSubscription = vi.fn();
  const leaveRoomSession = vi.fn();
  const replace = vi.fn();
  const notify = vi.fn();
  const roomChat = {
    cleanupSubscriptions: vi.fn(),
    initializeFromJoinData: vi.fn(),
    reset: vi.fn(),
  };

  return {
    ensureRoomSubscription,
    leaveRoomSession,
    notify,
    replace,
    refetchParticipants,
    refetchRoomPlayback,
    roomChat,
  };
});

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "room" }),
  useRouter: () => ({ replace: mocks.replace }),
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
vi.mock("@/src/shared/ui/action-feedback/ActionFeedbackProvider", () => ({
  useActionFeedback: () => ({ notify: mocks.notify }),
}));

describe("RoomPlaybackScreen join reads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("pre-join meta를 저장하고 joined 전환 시 최신 인원 meta를 재조회한다", async () => {
    const preJoinRoomMeta = {
      slug: "room",
      title: "방",
      isPublic: true,
      hasPassword: false,
      activeUsersCount: 0,
      tags: [],
    };
    const joinedRoomMeta = { ...preJoinRoomMeta, activeUsersCount: 1 };
    vi.mocked(fetchRoomMeta)
      .mockResolvedValueOnce(preJoinRoomMeta)
      .mockResolvedValueOnce(joinedRoomMeta);
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
    await waitFor(() => expect(fetchRoomMeta).toHaveBeenCalledTimes(2));
    expect(fetchRoomMeta).toHaveBeenNthCalledWith(
      1,
      "room",
      expect.any(AbortSignal),
    );
    expect(fetchRoomMeta).toHaveBeenNthCalledWith(
      2,
      "room",
      expect.any(AbortSignal),
    );
    expect(queryClient.getQueryData(roomKeys.meta("room"))).toEqual(
      joinedRoomMeta,
    );
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
    await waitFor(() => expect(fetchRoomMeta).toHaveBeenCalledTimes(2));
    expect(sharedQuerySignal?.aborted).toBe(false);

    unmount();
  });

  it("상세 경로 비밀번호 실패를 필드와 공통 알림에 표시하고 입력 시 해제한다", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchRoomMeta).mockResolvedValue({
      activeUsersCount: 1,
      hasPassword: true,
      isPublic: false,
      slug: "room",
      tags: [],
      title: "비밀 방",
    } as never);
    vi.mocked(joinRoom).mockRejectedValue(
      new ApiError({
        code: "room.access-denied",
        message: "비밀번호가 올바르지 않습니다.",
        status: 401,
      }),
    );
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <RoomPlaybackScreen />
      </QueryClientProvider>,
    );

    const passwordInput = await screen.findByPlaceholderText("비밀번호 입력");
    await user.type(passwordInput, "wrong");
    await user.click(screen.getByRole("button", { name: "확인" }));

    await waitFor(() =>
      expect(passwordInput).toHaveAttribute("aria-invalid", "true"),
    );
    expect(mocks.notify).toHaveBeenCalledWith({
      dedupeKey: "room-join:room:password",
      message: "비밀번호가 올바르지 않습니다.",
      tone: "error",
    });

    await user.type(passwordInput, "2");
    expect(passwordInput).toHaveAttribute("aria-invalid", "false");
  });

  it("직접 URL join 충돌도 확인 모달에서 동일 target으로 재요청한다", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchRoomMeta).mockResolvedValue({
      activeUsersCount: 1,
      hasPassword: false,
      isPublic: true,
      slug: "room",
      tags: [],
      title: "새 방",
    } as never);
    vi.mocked(joinRoom)
      .mockRejectedValueOnce(
        new RoomJoinError({
          code: "room.already-participating",
          data: { slug: "current-room", title: "현재 방" },
          message: "이미 참여 중입니다.",
          status: 409,
        }),
      )
      .mockResolvedValueOnce({ roomSlug: "room", timestamp: 1, data: null });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <RoomPlaybackScreen />
      </QueryClientProvider>,
    );

    const dialog = await screen.findByRole("dialog", {
      name: "이미 참여중인 방이 있습니다",
    });
    expect(dialog).toHaveTextContent("현재 ‘현재 방’ 방에 참여 중입니다.");
    await user.click(screen.getByRole("button", { name: "참여하기" }));

    await waitFor(() => expect(joinRoom).toHaveBeenCalledTimes(2));
    expect(joinRoom).toHaveBeenNthCalledWith(
      1,
      "room",
      {},
      { signal: expect.any(AbortSignal) },
    );
    expect(joinRoom).toHaveBeenNthCalledWith(
      2,
      "room",
      {},
      { signal: expect.any(AbortSignal) },
    );
    await waitFor(() =>
      expect(useRoomPlayback).toHaveBeenCalledWith("room", null, true),
    );
  });

  it("이동 전 join handoff가 있으면 방 화면에서 중복 join하지 않는다", async () => {
    const releaseHandoff = vi.fn();
    storeRoomJoinHandoff({
      releaseSocketSession: releaseHandoff,
      result: { roomSlug: "room", timestamp: 1, data: null },
      target: { password: "secret", slug: "room" },
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <RoomPlaybackScreen />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(releaseHandoff).toHaveBeenCalledOnce());
    expect(joinRoom).not.toHaveBeenCalled();
    expect(mocks.roomChat.initializeFromJoinData).toHaveBeenCalledWith(null);
    expect(mocks.ensureRoomSubscription).toHaveBeenCalledWith(
      "room",
      "secret",
    );
  });
});
