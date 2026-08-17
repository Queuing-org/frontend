import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/src/shared/api/api-error";
import { useRandomEntryRoom } from "./useRandomEntryRoom";
import { useRandomEntryNavigation } from "./useRandomEntryNavigation";

const { mutate, notify, requestRoomEntry } = vi.hoisted(() => ({
  mutate: vi.fn(),
  notify: vi.fn(),
  requestRoomEntry: vi.fn(),
}));

vi.mock("./useRandomEntryRoom", () => ({
  useRandomEntryRoom: vi.fn(),
}));
vi.mock("@/src/shared/ui/action-feedback/ActionFeedbackProvider", () => ({
  useActionFeedback: () => ({ notify }),
}));

type MutationOptions = {
  onError: (error: ApiError) => void;
  onSuccess: (room: { slug: string }) => void;
};

function getMutationOptions(callIndex = -1) {
  return mutate.mock.calls.at(callIndex)?.[1] as MutationOptions;
}

describe("useRandomEntryNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestRoomEntry.mockResolvedValue(undefined);
    vi.mocked(useRandomEntryRoom).mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useRandomEntryRoom>);
  });

  it("후보 없음 404는 서버 문구를 우선한 파란 공통 안내로 표시한다", () => {
    const { result } = renderHook(() =>
      useRandomEntryNavigation({
        isRoomEntryPending: false,
        requestRoomEntry,
      }),
    );

    act(() => result.current.requestRandomEntry());
    act(() =>
      getMutationOptions().onError(
        new ApiError({
          code: "room.random-join-unavailable",
          message: "지금 입장 가능한 방이 없습니다.",
          status: 404,
        }),
      ),
    );

    expect(notify).toHaveBeenCalledWith({
      dedupeKey: "room:random-entry",
      message: "지금 입장 가능한 방이 없습니다.",
      tone: "default",
    });
  });

  it("랜덤 후보를 받은 뒤 이동 전 join을 요청한다", async () => {
    const { result } = renderHook(() =>
      useRandomEntryNavigation({
        isRoomEntryPending: false,
        requestRoomEntry,
      }),
    );

    act(() => result.current.requestRandomEntry());
    act(() => getMutationOptions().onSuccess({ slug: " next-room " }));

    await waitFor(() =>
      expect(requestRoomEntry).toHaveBeenCalledWith("next-room"),
    );
  });

  it("랜덤 후보 join 실패를 빨간 알림으로 표시한다", async () => {
    requestRoomEntry.mockRejectedValue(
      new ApiError({ message: "입장 실패", status: 500 }),
    );
    const { result } = renderHook(() =>
      useRandomEntryNavigation({
        isRoomEntryPending: false,
        requestRoomEntry,
      }),
    );

    act(() => result.current.requestRandomEntry());
    act(() => getMutationOptions().onSuccess({ slug: "next-room" }));

    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith({
        dedupeKey: "room:random-entry",
        message: "입장 실패",
        tone: "error",
      }),
    );
  });

  it("랜덤 조회나 join 중이면 중복 요청 방지 pending을 유지한다", () => {
    vi.mocked(useRandomEntryRoom).mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useRandomEntryRoom>);
    const { result } = renderHook(() =>
      useRandomEntryNavigation({
        isRoomEntryPending: true,
        requestRoomEntry,
      }),
    );

    expect(result.current.isPending).toBe(true);
  });
});
