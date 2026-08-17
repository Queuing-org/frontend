import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { joinRoom } from "@/src/features/room/api/joinRoom";
import { acquireSocketSession } from "@/src/shared/api/websocket/stompConnection";
import { consumeRoomJoinHandoff } from "./roomJoinHandoff";
import { useRoomEntry } from "./useRoomEntry";

const { notify, push, releaseSocketSession, replace } = vi.hoisted(() => ({
  notify: vi.fn(),
  push: vi.fn(),
  releaseSocketSession: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
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

const publicRoom = {
  createdAt: "2026-08-17T00:00:00Z",
  id: 1,
  isPrivate: false,
  slug: "public-room",
  tags: [],
  title: "공개 방",
};
const privateRoom = {
  ...publicRoom,
  id: 2,
  isPrivate: true,
  slug: "private-room",
  title: "비밀 방",
};

describe("useRoomEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(acquireSocketSession).mockReturnValue(releaseSocketSession);
    vi.mocked(joinRoom).mockImplementation(async (slug) => ({
      roomSlug: slug,
      timestamp: 1,
      data: {
        participant: {
          participantType: "USER",
          participantId: "participant",
          userSlug: "user",
          nickname: "사용자",
          profileImageUrl: null,
        },
        recentChatMessages: [],
        roomAccessToken: "access-token",
      },
    }));
  });

  it("선택된 공개 방은 join 성공 뒤에만 URL로 이동한다", async () => {
    const { result } = renderHook(() =>
      useRoomEntry({ onSelectRoom: vi.fn(), selectedRoomSlug: "public-room" }),
    );

    act(() => result.current.requestRoomEntry(publicRoom));
    expect(push).not.toHaveBeenCalled();
    await waitFor(() => expect(joinRoom).toHaveBeenCalledOnce());
    await waitFor(() => expect(push).toHaveBeenCalledWith("/room/public-room"));

    consumeRoomJoinHandoff("public-room")?.releaseSocketSession();
  });

  it("비밀번호 방도 입력한 비밀번호로 join 성공 뒤 이동한다", async () => {
    const { result } = renderHook(() =>
      useRoomEntry({ onSelectRoom: vi.fn(), selectedRoomSlug: "private-room" }),
    );

    act(() => result.current.requestRoomEntry(privateRoom));
    expect(result.current.passwordRoom).toEqual(privateRoom);
    await act(async () =>
      result.current.submitPasswordEntry(privateRoom, "secret"),
    );

    expect(joinRoom).toHaveBeenCalledWith(
      "private-room",
      { password: "secret" },
      { signal: expect.any(AbortSignal) },
    );
    expect(result.current.passwordRoom).toBeNull();
    expect(push).toHaveBeenCalledWith("/room/private-room");
    consumeRoomJoinHandoff("private-room")?.releaseSocketSession();
  });

  it("선택되지 않은 방은 첫 요청에서 선택만 바꾼다", () => {
    const onSelectRoom = vi.fn();
    const { result } = renderHook(() =>
      useRoomEntry({ onSelectRoom, selectedRoomSlug: null }),
    );

    act(() => result.current.requestRoomEntry(publicRoom));

    expect(onSelectRoom).toHaveBeenCalledWith("public-room");
    expect(joinRoom).not.toHaveBeenCalled();
  });
});
