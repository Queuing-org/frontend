import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  joinRoom,
  RoomJoinError,
} from "@/src/features/room/api/joinRoom";
import type { RoomJoinErrorRoom } from "@/src/features/room/api/joinRoom.types";
import { acquireSocketSession } from "@/src/shared/api/websocket/stompConnection";
import { useRoomJoinTransition } from "./useRoomJoinTransition";

const { notify, releaseSocketSession, replace } = vi.hoisted(() => ({
  notify: vi.fn(),
  releaseSocketSession: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));
vi.mock("@/src/features/room/api/joinRoom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/src/features/room/api/joinRoom")>()),
  joinRoom: vi.fn(),
}));
vi.mock("@/src/shared/api/websocket/stompConnection", () => ({
  acquireSocketSession: vi.fn(),
}));
vi.mock("@/src/shared/ui/action-feedback/ActionFeedbackProvider", () => ({
  useActionFeedback: () => ({ notify }),
}));

const joinedResult = {
  roomSlug: "next-room",
  timestamp: 1,
  data: {
    participant: {
      participantType: "USER" as const,
      participantId: "participant",
      userSlug: "user",
      nickname: "사용자",
      profileImageUrl: null,
    },
    recentChatMessages: [],
    roomAccessToken: "access-token",
  },
};

function conflictError(
  data: RoomJoinErrorRoom = { slug: "current-room", title: "현재 방" },
) {
  return new RoomJoinError({
    status: 409,
    code: "room.already-participating",
    message: "이미 참여 중인 방이 있습니다.",
    data,
  });
}

describe("useRoomJoinTransition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.mocked(acquireSocketSession).mockReturnValue(releaseSocketSession);
  });

  it("모달을 1초 넘게 열어도 lease를 유지하고 동일 target/password로 한 번만 재요청한다", async () => {
    vi.useFakeTimers();
    const onJoined = vi.fn();
    vi.mocked(joinRoom)
      .mockRejectedValueOnce(conflictError())
      .mockResolvedValueOnce(joinedResult);
    const { result } = renderHook(() =>
      useRoomJoinTransition({ onJoined }),
    );

    await act(async () => {
      await result.current.requestJoin({
        password: "secret",
        slug: "next-room",
      });
    });
    expect(result.current.conflict?.currentRoom).toEqual({
      slug: "current-room",
      title: "현재 방",
    });

    act(() => vi.advanceTimersByTime(1_001));
    expect(releaseSocketSession).not.toHaveBeenCalled();

    await act(async () => result.current.confirmJoin());

    expect(joinRoom).toHaveBeenCalledTimes(2);
    expect(joinRoom).toHaveBeenNthCalledWith(
      1,
      "next-room",
      { password: "secret" },
      { signal: expect.any(AbortSignal) },
    );
    expect(joinRoom).toHaveBeenNthCalledWith(
      2,
      "next-room",
      { password: "secret" },
      { signal: expect.any(AbortSignal) },
    );
    expect(onJoined).toHaveBeenCalledWith(joinedResult, {
      password: "secret",
      slug: "next-room",
    });
    expect(sessionStorage.getItem("room-access-token:next-room")).toBe(
      "access-token",
    );
    expect(releaseSocketSession).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("확인 재요청 실패는 빨간 알림과 모달을 유지한다", async () => {
    vi.mocked(joinRoom)
      .mockRejectedValueOnce(conflictError())
      .mockRejectedValueOnce(new Error("재요청 실패"));
    const { result } = renderHook(() =>
      useRoomJoinTransition({ onJoined: vi.fn() }),
    );

    await act(async () => result.current.requestJoin({ slug: "next-room" }));
    await act(async () => result.current.confirmJoin());

    expect(result.current.conflict).not.toBeNull();
    expect(releaseSocketSession).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith({
      dedupeKey: "room-join:next-room:conflict",
      message: "재요청 실패",
      tone: "error",
    });
  });

  it("잘못된 conflict 응답은 모달을 만들지 않고 lease를 해제한다", async () => {
    vi.mocked(joinRoom).mockRejectedValue(conflictError({ slug: "current-room" }));
    const { result } = renderHook(() =>
      useRoomJoinTransition({ onJoined: vi.fn() }),
    );

    await expect(
      act(async () => result.current.requestJoin({ slug: "next-room" })),
    ).rejects.toThrow("이미 참여 중인 방이 있습니다.");
    expect(result.current.conflict).toBeNull();
    expect(releaseSocketSession).toHaveBeenCalledOnce();
  });

  it("돌아가기는 lease를 해제하고 오류 data.slug로 이동한다", async () => {
    vi.mocked(joinRoom).mockRejectedValue(conflictError());
    const { result } = renderHook(() =>
      useRoomJoinTransition({ onJoined: vi.fn() }),
    );
    await act(async () => result.current.requestJoin({ slug: "next-room" }));

    act(() => result.current.returnToCurrentRoom());

    expect(releaseSocketSession).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledWith("/room/current-room");
  });
});
