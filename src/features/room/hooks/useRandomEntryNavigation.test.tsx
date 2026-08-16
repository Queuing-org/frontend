import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/src/shared/api/api-error";
import { useRandomEntryRoom } from "./useRandomEntryRoom";
import { useRandomEntryNavigation } from "./useRandomEntryNavigation";

const { mutate, notify, push } = vi.hoisted(() => ({
  mutate: vi.fn(),
  notify: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
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
    vi.mocked(useRandomEntryRoom).mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useRandomEntryRoom>);
  });

  it("입장 가능한 방이 없으면 기본 공통 알림을 표시한다", () => {
    const { result } = renderHook(() => useRandomEntryNavigation());

    act(() => result.current.requestRandomEntry());
    act(() =>
      getMutationOptions().onError(
        new ApiError({
          code: "room.random-join-unavailable",
          message: "unavailable",
          status: 404,
        }),
      ),
    );

    expect(notify).toHaveBeenCalledWith({
      dedupeKey: "room:random-entry",
      message: "입장 가능한 공개방이 없어요",
      tone: "default",
    });
  });

  it("일반 실패는 오류 알림을 표시하고 성공하면 방으로 이동한다", () => {
    const { result } = renderHook(() => useRandomEntryNavigation());

    act(() => result.current.requestRandomEntry());
    act(() =>
      getMutationOptions().onError(
        new ApiError({ message: "실패", status: 500 }),
      ),
    );
    expect(notify).toHaveBeenCalledWith({
      dedupeKey: "room:random-entry",
      message: "실패",
      tone: "error",
    });

    act(() => getMutationOptions().onSuccess({ slug: "next-room" }));
    expect(push).toHaveBeenCalledWith("/room/next-room");
  });
});
